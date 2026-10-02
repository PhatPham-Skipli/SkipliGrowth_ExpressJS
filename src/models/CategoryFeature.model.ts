import {
  isBoolean,
  isNonEmptyString,
  isNumber,
  isOptionalString,
  isString,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from '@src/models/common/types';

/******************************************************************************
                                  Types
******************************************************************************/

export type ServiceCategory =
  | 'web-ordering'
  | 'menu-design'
  | 'local-marketing'
  | 'photo-video'
  | 'ops-support';

export type FeatureValueType = 'boolean' | 'number' | 'text';

export interface ITierValueMap {
  Basic: boolean | number | string;
  Standard: boolean | number | string;
  Premium: boolean | number | string;
}

/**
 * @entity category_features
 * Standard predefined feature field for a hospitality service category.
 */
export interface ICategoryFeature extends Entity {
  category: ServiceCategory;
  name: string;
  code: string;
  description?: string;
  valueType: FeatureValueType;
  unit?: string;
  isCore: boolean;
  displayOrder: number;
  isActive: boolean;
  defaultTierValues?: ITierValueMap;
}

/******************************************************************************
                                 Constants
******************************************************************************/

const isTierValueMap = (val: unknown): val is ITierValueMap => {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  return 'Basic' in obj && 'Standard' in obj && 'Premium' in obj;
};

const isOptionalTierValueMap = (
  val: unknown,
): val is ITierValueMap | undefined => {
  return val === undefined || isTierValueMap(val);
};

const GetDefaults = (): ICategoryFeature => ({
  id: '',
  category: 'menu-design',
  name: '',
  code: '',
  description: '',
  valueType: 'boolean',
  unit: '',
  isCore: true,
  displayOrder: 0,
  isActive: true,
  defaultTierValues: {
    Basic: false,
    Standard: true,
    Premium: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<ICategoryFeature> = {
  id: isString,
  category: isString as (val: unknown) => val is ServiceCategory,
  name: isString,
  code: isString,
  description: isOptionalString,
  valueType: isString as (val: unknown) => val is FeatureValueType,
  unit: isOptionalString,
  isCore: isBoolean,
  displayOrder: isNumber,
  isActive: isBoolean,
  defaultTierValues: isOptionalTierValueMap,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

/******************************************************************************
                                  Setup
******************************************************************************/

const parseCategoryFeature = parseObject<ICategoryFeature>(schema);

const isCompleteCategoryFeature = testObject<ICategoryFeature>({
  ...schema,
  name: isNonEmptyString,
  code: isNonEmptyString,
});

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Setup new category feature object.
 */
function new_(feature?: Partial<ICategoryFeature>): ICategoryFeature {
  return parseCategoryFeature({ ...GetDefaults(), ...feature }, (errors) => {
    throw new Error(
      'Setup new category feature failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isCategoryFeature: isCompleteCategoryFeature,
} as const;
