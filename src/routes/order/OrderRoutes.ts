import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  IBeforeTransformResponseType,
  IRequestHasUser,
} from '@src/common/types/responses/api.response';
import { IOrder } from '@src/models/Order.model';
import OrderService, {
  CreateOrderDto,
  DeliverWorkDto,
} from '@src/services/OrderService';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Place a new service order.
 *
 * @route POST /api/orders
 */
async function create(
  req: Request,
  res: Response<IBeforeTransformResponseType<IOrder>>,
) {
  const user = (req as IRequestHasUser).user;
  const dto = req.body as CreateOrderDto;

  const order = await OrderService.createOrder(user.id, dto);

  return res.status(HttpStatusCodes.CREATED).json({
    message: 'Order created successfully',
    data: order,
    type: 'response',
    statusCode: HttpStatusCodes.CREATED,
  });
}

/**
 * Get all orders commissioned by the logged in buyer (Restaurant Owner).
 *
 * @route GET /api/orders/buyer
 */
async function getBuyerOrders(
  req: Request,
  res: Response<IBeforeTransformResponseType<IOrder[]>>,
) {
  const user = (req as IRequestHasUser).user;
  const orders = await OrderService.getBuyerOrders(user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved buyer orders successfully',
    data: orders,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get all pipeline orders assigned to the logged in freelancer.
 *
 * @route GET /api/orders/seller
 */
async function getSellerOrders(
  req: Request,
  res: Response<IBeforeTransformResponseType<IOrder[]>>,
) {
  const user = (req as IRequestHasUser).user;
  const orders = await OrderService.getSellerOrders(user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved seller orders successfully',
    data: orders,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get single order details by ID.
 *
 * @route GET /api/orders/:id
 */
async function getById(
  req: Request,
  res: Response<IBeforeTransformResponseType<IOrder>>,
) {
  const user = (req as IRequestHasUser).user;
  const id = req.params.id as string;

  const order = await OrderService.getOrderById(id, user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved order successfully',
    data: order,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Submit deliverables for review (Seller action).
 *
 * @route PATCH /api/orders/:id/deliver
 */
async function deliver(
  req: Request,
  res: Response<IBeforeTransformResponseType<IOrder>>,
) {
  const user = (req as IRequestHasUser).user;
  const id = req.params.id as string;
  const dto = req.body as DeliverWorkDto;

  const order = await OrderService.deliverWork(id, user.id, dto);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Delivered work submitted for review',
    data: order,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Approve order & release escrow funds (Buyer action).
 *
 * @route PATCH /api/orders/:id/approve
 */
async function approve(
  req: Request,
  res: Response<IBeforeTransformResponseType<IOrder>>,
) {
  const user = (req as IRequestHasUser).user;
  const id = req.params.id as string;

  const order = await OrderService.approveOrder(id, user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Order approved and escrow funds completed',
    data: order,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  create,
  getBuyerOrders,
  getSellerOrders,
  getById,
  deliver,
  approve,
} as const;
