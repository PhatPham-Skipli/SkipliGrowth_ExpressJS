import {
  isNonEmptyString,
  isNumber,
  isOptionalString,
  isString,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { ServiceCategory } from '@src/models/CategoryFeature.model';
import { Entity } from '@src/models/common/types';
import { IGigPackageFeatureValue } from '@src/models/Gig.model';

/******************************************************************************
                                  Types
******************************************************************************/

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'REVISION_REQUESTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IOrderAddon {
  id: string;
  name: string;
  price: number;
}

export interface IClientCustomRequest {
  featureName: string;
  description: string;
}

export interface IOrderDeliverable {
  fileUrl: string;
  note: string;
  submittedAt: Date;
}

export interface IOrderClientCustomRequests {
  requestedExtraFeatures?: string[];
  specialInstructions?: string;
  additionalCustomFields?: IClientCustomRequest[];
}

/**
 * @entity orders
 * Represents a commissioned restaurant service order held in Escrow.
 */
export interface IOrder extends Entity {
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  restaurantId?: string;
  restaurantName: string;
  gigId: string;
  gigTitle: string;
  gigImage: string;
  category: ServiceCategory;
  categoryLabel: string;
  packageName: 'Basic' | 'Standard' | 'Premium';
  packagePrice: number;
  packageFeaturesSnapshot: IGigPackageFeatureValue[];
  selectedAddons: IOrderAddon[];
  clientCustomRequests?: IOrderClientCustomRequests;
  totalAmount: number;
  status: OrderStatus;
  deliveryDays: number;
  deadline: Date;
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  paidAt?: Date | null;
  deliverables?: IOrderDeliverable[];
  progressPercent: number;
}

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): IOrder => ({
  id: '',
  orderNumber: '',
  buyerId: '',
  sellerId: '',
  restaurantId: '',
  restaurantName: '',
  gigId: '',
  gigTitle: '',
  gigImage: '',
  category: 'menu-design',
  categoryLabel: 'Menu & Visual Identity',
  packageName: 'Basic',
  packagePrice: 0,
  packageFeaturesSnapshot: [],
  selectedAddons: [],
  totalAmount: 0,
  status: 'PENDING_PAYMENT',
  deliveryDays: 3,
  deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  progressPercent: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IOrder> = {
  id: isString,
  orderNumber: isString,
  buyerId: isString,
  sellerId: isString,
  restaurantId: isOptionalString,
  restaurantName: isString,
  gigId: isString,
  gigTitle: isString,
  gigImage: isString,
  category: isString as (val: unknown) => val is ServiceCategory,
  categoryLabel: isString,
  packageName: isString as (val: unknown) => val is 'Basic' | 'Standard' | 'Premium',
  packagePrice: isNumber,
  packageFeaturesSnapshot: (val: unknown): val is IGigPackageFeatureValue[] =>
    Array.isArray(val),
  selectedAddons: (val: unknown): val is IOrderAddon[] => Array.isArray(val),
  clientCustomRequests: (val: unknown): val is IOrderClientCustomRequests | undefined =>
    val === undefined || typeof val === 'object',
  totalAmount: isNumber,
  status: isString as (val: unknown) => val is OrderStatus,
  deliveryDays: isNumber,
  deadline: transformIsDate,
  stripePaymentIntentId: isOptionalString,
  stripeClientSecret: isOptionalString,
  paidAt: (val: unknown): val is Date | null | undefined =>
    val === undefined || val === null || val instanceof Date,
  deliverables: (val: unknown): val is IOrderDeliverable[] | undefined =>
    val === undefined || Array.isArray(val),
  progressPercent: isNumber,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

/******************************************************************************
                                  Setup
******************************************************************************/

const parseOrder = parseObject<IOrder>(schema);

const isCompleteOrder = testObject<IOrder>({
  ...schema,
  orderNumber: isNonEmptyString,
  buyerId: isNonEmptyString,
  sellerId: isNonEmptyString,
});

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Setup new order object.
 */
function new_(order?: Partial<IOrder>): IOrder {
  return parseOrder({ ...GetDefaults(), ...order }, (errors) => {
    throw new Error(
      'Setup new order failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isOrder: isCompleteOrder,
} as const;
