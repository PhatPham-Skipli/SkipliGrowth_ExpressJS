import logger from 'jet-logger';
import Stripe from 'stripe';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@src/common/exceptions/api.exception';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@src/config/stripe';
import { IOrder } from '@src/models/Order.model';
import OrderRepo from '@src/repos/OrderRepo';

import SocketService from './SocketService';

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  order: IOrder;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Initialize or retrieve a Stripe PaymentIntent for an order.
 * Inbuilt Stripe Elements in the frontend uses the returned clientSecret.
 */
async function createPaymentIntent(
  orderId: string,
  buyerId: string,
): Promise<CreatePaymentIntentResponse> {
  const order = await OrderRepo.getById(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.buyerId !== buyerId) {
    throw new ForbiddenException(
      'You are not authorized to pay for this order',
    );
  }

  if (order.status !== 'PENDING_PAYMENT') {
    throw new BadRequestException(
      `Order is already paid or cannot be processed (Status: ${order.status})`,
    );
  }

  // If a payment intent was already created and has a client secret, return it
  if (order.stripePaymentIntentId && order.stripeClientSecret) {
    try {
      const existingIntent = await stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId,
      );
      if (existingIntent.status === 'succeeded') {
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
        }
        throw new BadRequestException(
          'Order is already paid and held in Escrow',
        );
      }

      if (existingIntent.client_secret) {
        return {
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
          order,
        };
      }
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      // If retrieval failed, fallback to creating a fresh intent
    }
  }

  // Stripe requires amount in cents
  const amountInCents = Math.round(order.totalAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      gigTitle: order.gigTitle.slice(0, 100),
    },
    description: `Skipli Marketplace Order ${order.orderNumber} - ${order.gigTitle.slice(0, 50)}`,
  });

  if (!paymentIntent.client_secret) {
    throw new BadRequestException('Failed to generate Stripe client secret');
  }

  const updatedOrder = await OrderRepo.update(orderId, {
    stripePaymentIntentId: paymentIntent.id,
    stripeClientSecret: paymentIntent.client_secret,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    order: updatedOrder || order,
  };
}

/**
 * Confirm payment status directly from Stripe.
 * Fallback and instant confirmation mechanism for client after `stripe.confirmPayment` succeeds.
 */
async function confirmPayment(
  orderId: string,
  buyerId: string,
  paymentIntentId?: string,
): Promise<IOrder> {
  const order = await OrderRepo.getById(orderId);
  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.buyerId !== buyerId && order.sellerId !== buyerId) {
    throw new ForbiddenException(
      'You are not authorized to confirm payment for this order',
    );
  }

  // Idempotency: if order is already funded or in progress, return immediately
  if (order.status !== 'PENDING_PAYMENT') {
    return order;
  }

  const piId = paymentIntentId || order.stripePaymentIntentId;
  if (!piId) {
    throw new BadRequestException(
      'No Stripe PaymentIntent ID found for this order',
    );
  }

  // Retrieve intent state directly from Stripe
  const intent = await stripe.paymentIntents.retrieve(piId);

  if (intent.status === 'succeeded') {
    const updated = await OrderRepo.update(orderId, {
      status: 'IN_PROGRESS',
      paidAt: new Date(),
      progressPercent: 15,
      stripePaymentIntentId: intent.id,
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

    return order;
  }

  if (intent.status === 'processing') {
    return order;
  }

  throw new BadRequestException(
    `Payment has not succeeded on Stripe yet (Current Status: ${intent.status})`,
  );
}

/**
 * Handle incoming Stripe Webhook events.
 */
async function handleStripeWebhook(
  signature: string,
  rawBody: Buffer,
): Promise<{ received: boolean; orderId?: string }> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.err(`[Stripe Webhook Signature Verification Failed]: ${message}`);
    throw new BadRequestException(`Webhook Error: ${message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        const order = await OrderRepo.getById(orderId);
        if (order && order.status === 'PENDING_PAYMENT') {
          const updated = await OrderRepo.update(orderId, {
            status: 'IN_PROGRESS',
            paidAt: new Date(),
            progressPercent: 15,
          });

          logger.info(
            `[Stripe Webhook] Order ${order.orderNumber} successfully held in Escrow! Status: IN_PROGRESS`,
          );

          // Emit real-time notification to buyer & seller via socket
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
          }

          return { received: true, orderId };
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      logger.warn(
        `[Stripe Webhook] Payment failed for intent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message || ''}`,
      );
      break;
    }

    default:
      // Other unhandled event types
      break;
  }

  return { received: true };
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
} as const;
