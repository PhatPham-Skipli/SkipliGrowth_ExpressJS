import { ServiceCategory } from '@src/models/CategoryFeature.model';
import { IGigPackageFeatureValue } from '@src/models/Gig.model';
import {
  IClientCustomRequest,
  IOrder,
  IOrderAddon,
  IOrderDeliverable,
  OrderStatus,
} from '@src/models/Order.model';

import { db } from '../config/firebase';

// ============================================================================
// Firestore Data Converter for Type Safety
// ============================================================================
const orderConverter = {
  toFirestore(order: IOrder): FirebaseFirestore.DocumentData {
    return order;
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): IOrder {
    const raw = snapshot.data();

    const toDate = (val: unknown): Date | null => {
      if (!val) return null;
      if (
        typeof val === 'object' &&
        val !== null &&
        'toDate' in val &&
        typeof (val as { toDate: () => Date }).toDate === 'function'
      ) {
        return (val as { toDate: () => Date }).toDate();
      }
      if (val instanceof Date) return val;
      if (typeof val === 'string' || typeof val === 'number') {
        return new Date(val);
      }
      return null;
    };

    return {
      id: snapshot.id,
      orderNumber:
        typeof raw.orderNumber === 'string' ? raw.orderNumber : `#SKP-${snapshot.id.slice(-4)}`,
      buyerId: typeof raw.buyerId === 'string' ? raw.buyerId : '',
      sellerId: typeof raw.sellerId === 'string' ? raw.sellerId : '',
      restaurantId:
        typeof raw.restaurantId === 'string' ? raw.restaurantId : '',
      restaurantName:
        typeof raw.restaurantName === 'string'
          ? raw.restaurantName
          : 'Restaurant',
      gigId: typeof raw.gigId === 'string' ? raw.gigId : '',
      gigTitle: typeof raw.gigTitle === 'string' ? raw.gigTitle : '',
      gigImage: typeof raw.gigImage === 'string' ? raw.gigImage : '',
      category: (raw.category as ServiceCategory) || 'menu-design',
      categoryLabel:
        typeof raw.categoryLabel === 'string'
          ? raw.categoryLabel
          : 'Menu & Visual Identity',
      packageName:
        (raw.packageName as 'Basic' | 'Standard' | 'Premium') || 'Basic',
      packagePrice:
        typeof raw.packagePrice === 'number' ? raw.packagePrice : 0,
      packageFeaturesSnapshot: Array.isArray(raw.packageFeaturesSnapshot)
        ? (raw.packageFeaturesSnapshot as IGigPackageFeatureValue[])
        : [],
      selectedAddons: Array.isArray(raw.selectedAddons)
        ? (raw.selectedAddons as IOrderAddon[])
        : [],
      clientCustomRequests: raw.clientCustomRequests || undefined,
      totalAmount:
        typeof raw.totalAmount === 'number' ? raw.totalAmount : 0,
      status: (raw.status as OrderStatus) || 'PENDING_PAYMENT',
      deliveryDays:
        typeof raw.deliveryDays === 'number' ? raw.deliveryDays : 3,
      deadline: toDate(raw.deadline) || new Date(Date.now() + 3 * 86400000),
      stripePaymentIntentId:
        typeof raw.stripePaymentIntentId === 'string'
          ? raw.stripePaymentIntentId
          : undefined,
      stripeClientSecret:
        typeof raw.stripeClientSecret === 'string'
          ? raw.stripeClientSecret
          : undefined,
      paidAt: toDate(raw.paidAt),
      deliverables: Array.isArray(raw.deliverables)
        ? (raw.deliverables as IOrderDeliverable[])
        : [],
      progressPercent:
        typeof raw.progressPercent === 'number' ? raw.progressPercent : 0,
      createdAt: toDate(raw.createdAt) || new Date(),
      updatedAt: toDate(raw.updatedAt) || new Date(),
    };
  },
};

const ordersCollection = db
  .collection('orders')
  .withConverter(orderConverter);

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get order by ID.
 */
async function getById(id: string): Promise<IOrder | null> {
  const snapshot = await ordersCollection.doc(id).get();
  if (!snapshot.exists) return null;
  return snapshot.data() || null;
}

/**
 * Get order by orderNumber (#SKP-XXXX).
 */
async function getByOrderNumber(orderNumber: string): Promise<IOrder | null> {
  const snapshot = await ordersCollection
    .where('orderNumber', '==', orderNumber)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

/**
 * Get order by Stripe PaymentIntent ID.
 */
async function getByPaymentIntentId(piId: string): Promise<IOrder | null> {
  const snapshot = await ordersCollection
    .where('stripePaymentIntentId', '==', piId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

/**
 * List orders by buyer ID (Restaurant Owner).
 */
async function listByBuyer(buyerId: string): Promise<IOrder[]> {
  const snapshot = await ordersCollection
    .where('buyerId', '==', buyerId)
    .get();

  return snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * List orders by seller ID (Freelancer).
 */
async function listBySeller(sellerId: string): Promise<IOrder[]> {
  const snapshot = await ordersCollection
    .where('sellerId', '==', sellerId)
    .get();

  return snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Create a new order.
 */
async function create(data: Partial<IOrder>): Promise<IOrder> {
  const docRef = ordersCollection.doc();
  const orderNumber =
    data.orderNumber || `#SKP-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: IOrder = {
    id: docRef.id,
    orderNumber,
    buyerId: data.buyerId || '',
    sellerId: data.sellerId || '',
    restaurantId: data.restaurantId || '',
    restaurantName: data.restaurantName || 'Restaurant Partner',
    gigId: data.gigId || '',
    gigTitle: data.gigTitle || '',
    gigImage: data.gigImage || '',
    category: data.category || 'menu-design',
    categoryLabel: data.categoryLabel || 'Menu & Visual Identity',
    packageName: data.packageName || 'Basic',
    packagePrice: data.packagePrice || 0,
    packageFeaturesSnapshot: data.packageFeaturesSnapshot || [],
    selectedAddons: data.selectedAddons || [],
    clientCustomRequests: data.clientCustomRequests,
    totalAmount: data.totalAmount || 0,
    status: data.status || 'PENDING_PAYMENT',
    deliveryDays: data.deliveryDays || 3,
    deadline:
      data.deadline ||
      new Date(Date.now() + (data.deliveryDays || 3) * 86400000),
    stripePaymentIntentId: data.stripePaymentIntentId,
    stripeClientSecret: data.stripeClientSecret,
    paidAt: data.paidAt || null,
    deliverables: data.deliverables || [],
    progressPercent: data.progressPercent || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await docRef.set(newOrder);
  return newOrder;
}

/**
 * Update an order.
 */
async function update(
  id: string,
  data: Partial<IOrder>,
): Promise<IOrder | null> {
  const docRef = ordersCollection.doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  await docRef.update(updateData);
  const updatedDoc = await docRef.get();
  return updatedDoc.data() || null;
}

/**
 * Update order status.
 */
async function updateStatus(
  id: string,
  status: OrderStatus,
  meta: Partial<IOrder> = {},
): Promise<IOrder | null> {
  return update(id, {
    status,
    ...meta,
  });
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  getById,
  getByOrderNumber,
  getByPaymentIntentId,
  listByBuyer,
  listBySeller,
  create,
  update,
  updateStatus,
} as const;
