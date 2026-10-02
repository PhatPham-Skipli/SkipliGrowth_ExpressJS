import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { BadRequestException } from '@src/common/exceptions/api.exception';
import {
  IBeforeTransformResponseType,
  IRequestHasUser,
} from '@src/common/types/responses/api.response';
import { IOrder } from '@src/models/Order.model';
import PaymentService, {
  CreatePaymentIntentResponse,
} from '@src/services/PaymentService';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Create or retrieve a Stripe PaymentIntent for Inbuilt Stripe Elements.
 *
 * @route POST /api/payments/create-intent
 */
async function createIntent(
  req: Request,
  res: Response<IBeforeTransformResponseType<CreatePaymentIntentResponse>>,
) {
  const user = (req as IRequestHasUser).user;
  const { orderId } = req.body as { orderId: string };

  if (!orderId) {
    throw new BadRequestException('Order ID is required');
  }

  const result = await PaymentService.createPaymentIntent(orderId, user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Stripe PaymentIntent created successfully',
    data: result,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Confirm payment status directly from Stripe.
 *
 * @route POST /api/payments/confirm
 */
async function confirmPayment(
  req: Request,
  res: Response<IBeforeTransformResponseType<IOrder>>,
) {
  const user = (req as IRequestHasUser).user;
  const { orderId, paymentIntentId } = req.body as {
    orderId: string;
    paymentIntentId?: string;
  };

  if (!orderId) {
    throw new BadRequestException('Order ID is required');
  }

  const result = await PaymentService.confirmPayment(
    orderId,
    user.id,
    paymentIntentId,
  );

  return res.status(HttpStatusCodes.OK).json({
    message: 'Payment confirmed and order placed in progress',
    data: result,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Handle incoming Stripe Webhook.
 *
 * @route POST /api/payments/webhook
 */
async function webhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  const rawBody = req.rawBody;

  if (!signature || !rawBody) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .send('Missing Stripe signature or raw payload');
  }

  try {
    const result = await PaymentService.handleStripeWebhook(
      signature as string,
      rawBody,
    );
    return res.status(HttpStatusCodes.OK).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(HttpStatusCodes.BAD_REQUEST).send(message);
  }
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  createIntent,
  confirmPayment,
  webhook,
} as const;
