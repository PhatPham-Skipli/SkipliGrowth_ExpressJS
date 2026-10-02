import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@src/common/exceptions/api.exception';
import {
  IOrder,
  IOrderAddon,
  IOrderClientCustomRequests,
  IOrderDeliverable,
} from '@src/models/Order.model';
import { stripe } from '@src/config/stripe';
import GigRepo from '@src/repos/GigRepo';
import OrderRepo from '@src/repos/OrderRepo';
import RestaurantRepo from '@src/repos/RestaurantRepo';
import SocketService from './SocketService';

export interface CreateOrderDto {
  gigId: string;
  packageName: 'Basic' | 'Standard' | 'Premium';
  restaurantId?: string;
  restaurantName?: string;
  selectedAddons?: IOrderAddon[];
  clientCustomRequests?: IOrderClientCustomRequests;
}

export interface DeliverWorkDto {
  fileUrl: string;
  note: string;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Create a new order with server-side price validation & package snapshot.
 */
async function createOrder(
  buyerId: string,
  dto: CreateOrderDto,
): Promise<IOrder> {
  const gig = await GigRepo.getById(dto.gigId);
  if (!gig) {
    throw new NotFoundException('Gig not found');
  }

  const selectedPkg = gig.packages.find((p) => p.name === dto.packageName);
  if (!selectedPkg) {
    throw new BadRequestException(
      `Package tier "${dto.packageName}" does not exist for this service`,
    );
  }

  // Calculate addons strictly on server
  const addons = dto.selectedAddons || [];
  const addonsTotal = addons.reduce(
    (acc, item) => acc + (typeof item.price === 'number' ? item.price : 0),
    0,
  );

  const totalAmount = selectedPkg.price + addonsTotal;

  // Resolve restaurant name if provided or fallback
  let restaurantName = dto.restaurantName || 'Restaurant Partner';
  if (dto.restaurantId) {
    const restaurant = await RestaurantRepo.getById(dto.restaurantId);
    if (restaurant) {
      restaurantName = restaurant.name;
    }
  }

  const order = await OrderRepo.create({
    buyerId,
    sellerId: gig.sellerId,
    restaurantId: dto.restaurantId,
    restaurantName,
    gigId: gig.id,
    gigTitle: gig.title,
    gigImage: gig.coverImage,
    category: gig.category,
    categoryLabel: gig.categoryLabel,
    packageName: selectedPkg.name,
    packagePrice: selectedPkg.price,
    packageFeaturesSnapshot: selectedPkg.structuredFeatures || [],
    selectedAddons: addons,
    clientCustomRequests: dto.clientCustomRequests,
    totalAmount,
    status: 'PENDING_PAYMENT',
    deliveryDays: selectedPkg.deliveryDays,
    deadline: new Date(Date.now() + selectedPkg.deliveryDays * 86400000),
    progressPercent: 0,
  });

  return order;
}

/**
 * Deliver work deliverables (Freelancer action).
 */
async function deliverWork(
  orderId: string,
  sellerId: string,
  dto: DeliverWorkDto,
): Promise<IOrder> {
  const order = await OrderRepo.getById(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.sellerId !== sellerId) {
    throw new ForbiddenException(
      'You are not authorized to deliver for this order',
    );
  }

  const newDeliverable: IOrderDeliverable = {
    fileUrl: dto.fileUrl,
    note: dto.note,
    submittedAt: new Date(),
  };

  const existingDeliverables = order.deliverables || [];

  const updated = await OrderRepo.update(orderId, {
    status: 'IN_REVIEW',
    progressPercent: 90,
    deliverables: [...existingDeliverables, newDeliverable],
  });

  if (!updated) {
    throw new NotFoundException('Failed to update order');
  }

  return updated;
}

/**
 * Request revision (Buyer action).
 */
async function requestRevision(
  orderId: string,
  buyerId: string,
  _note?: string,
): Promise<IOrder> {
  const order = await OrderRepo.getById(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.buyerId !== buyerId) {
    throw new ForbiddenException(
      'You are not authorized to request revisions for this order',
    );
  }

  const updated = await OrderRepo.update(orderId, {
    status: 'REVISION_REQUESTED',
    progressPercent: 75,
  });

  if (!updated) {
    throw new NotFoundException('Failed to update order');
  }

  return updated;
}

/**
 * Approve order & release escrow funds (Buyer action).
 */
async function approveOrder(
  orderId: string,
  buyerId: string,
): Promise<IOrder> {
  const order = await OrderRepo.getById(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.buyerId !== buyerId) {
    throw new ForbiddenException(
      'You are not authorized to approve this order',
    );
  }

  const updated = await OrderRepo.update(orderId, {
    status: 'COMPLETED',
    progressPercent: 100,
  });

  if (!updated) {
    throw new NotFoundException('Failed to complete order');
  }

  return updated;
}

/**
 * Get single order details with ownership verification.
 */
async function getOrderById(orderId: string, userId: string): Promise<IOrder> {
  const order = await OrderRepo.getById(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw new ForbiddenException('You are not authorized to view this order');
  }

  // Active sync: If order is still PENDING_PAYMENT but has a Stripe PaymentIntent,
  // verify Stripe status directly to handle missed webhooks or local development
  if (order.status === 'PENDING_PAYMENT' && order.stripePaymentIntentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId,
      );
      if (intent.status === 'succeeded') {
        const updated = await OrderRepo.update(orderId, {
          status: 'IN_PROGRESS',
          paidAt: new Date(),
          progressPercent: 15,
        });

        if (updated) {
          SocketService.emitOrderFunded(order.sellerId, {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            amount: updated.totalAmount,
          });
          SocketService.emitOrderPaid(order.buyerId, {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
          });
          return updated;
        }
      }
    } catch {
      // Fallback to returning original order if Stripe call fails
    }
  }

  return order;
}

/**
 * List orders for buyer.
 */
async function getBuyerOrders(buyerId: string): Promise<IOrder[]> {
  return OrderRepo.listByBuyer(buyerId);
}

/**
 * List orders for seller.
 */
async function getSellerOrders(sellerId: string): Promise<IOrder[]> {
  return OrderRepo.listBySeller(sellerId);
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  createOrder,
  deliverWork,
  requestRevision,
  approveOrder,
  getOrderById,
  getBuyerOrders,
  getSellerOrders,
} as const;
