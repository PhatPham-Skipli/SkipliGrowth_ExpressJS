import {
  isBoolean,
  isNonEmptyString,
  isNumber,
  isOptionalBoolean,
  isOptionalString,
  isString,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { ServiceCategory } from '@src/models/CategoryFeature.model';
import { IPublicUser } from '@src/models/User.model';
import { Entity } from '@src/models/common/types';

/******************************************************************************
                                  Types
******************************************************************************/

export interface IGigPackageFeatureValue {
  featureId?: string;
  name: string;
  value: boolean | number | string;
  unit?: string;
  isCustom?: boolean;
}

export interface IGigPackage {
  name: 'Basic' | 'Standard' | 'Premium';
  title: string;
  description: string;
  deliveryDays: number;
  revisions: number | 'Unlimited';
  price: number;
  features: string[];
  structuredFeatures?: IGigPackageFeatureValue[];
}

export interface IGigFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface IGigSellerSnapshot {
  id: string;
  name: string;
  avatar: string;
  level: string;
  specialty: string;
  location: string;
  rating: number;
  reviewCount: number;
}

export type GigStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED';

/**
 * @entity gigs
 * Represents a specialized service package published on the Skipli Marketplace.
 * References seller user document by sellerId.
 */
export interface IGig extends Entity {
  sellerId: string;
  title: string;
  slug: string;
  category: ServiceCategory;
  categoryLabel: string;
  coverImage: string;
  galleryImages: string[];
  startingPrice: number;
  packages: IGigPackage[];
  tags: string[];
  description?: string;
  highlights?: string[];
  faqs?: IGigFAQ[];
  status: GigStatus;
  rating: number;
  reviewCount: number;
  isTopRated?: boolean;
  isBestSeller?: boolean;
}

/**
 * Response type when gig is populated with public user information.
 */
export interface IGigWithUser extends IGig {
  user: IPublicUser | null;
  seller?: IGigSellerSnapshot;
}

/******************************************************************************
                                 Constants
******************************************************************************/

const isStringArray = (val: unknown): val is string[] =>
  Array.isArray(val) && val.every((item) => typeof item === 'string');

const isGigPackages = (val: unknown): val is IGigPackage[] => {
  if (!Array.isArray(val) || val.length === 0) return false;
  return val.every(
    (pkg) =>
      typeof pkg === 'object' &&
      pkg !== null &&
      typeof pkg.name === 'string' &&
      typeof pkg.title === 'string' &&
      typeof pkg.price === 'number',
  );
};

const isOptionalFaqs = (val: unknown): val is IGigFAQ[] | undefined => {
  if (val === undefined || val === null) return true;
  return (
    Array.isArray(val) &&
    val.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.question === 'string' &&
        typeof item.answer === 'string',
    )
  );
};

const GetDefaults = (): IGig => ({
  id: '',
  sellerId: '',
  title: '',
  slug: '',
  category: 'menu-design',
  categoryLabel: 'Menu & Visual Identity',
  coverImage: '',
  galleryImages: [],
  startingPrice: 0,
  packages: [],
  tags: [],
  description: '',
  highlights: [],
  faqs: [],
  status: 'PUBLISHED',
  rating: 5.0,
  reviewCount: 0,
  isTopRated: false,
  isBestSeller: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IGig> = {
  id: isString,
  sellerId: isString,
  title: isString,
  slug: isString,
  category: isString as (val: unknown) => val is ServiceCategory,
  categoryLabel: isString,
  coverImage: isString,
  galleryImages: isStringArray,
  startingPrice: isNumber,
  packages: isGigPackages,
  tags: isStringArray,
  description: isOptionalString,
  highlights: isStringArray as unknown as (
    val: unknown,
  ) => val is string[] | undefined,
  faqs: isOptionalFaqs,
  status: isString as (val: unknown) => val is GigStatus,
  rating: isNumber,
  reviewCount: isNumber,
  isTopRated: isOptionalBoolean,
  isBestSeller: isOptionalBoolean,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

/******************************************************************************
                                  Setup
******************************************************************************/

const parseGig = parseObject<IGig>(schema);

const isCompleteGig = testObject<IGig>({
  ...schema,
  sellerId: isNonEmptyString,
  title: isNonEmptyString,
});

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Setup new gig object.
 */
function new_(gig?: Partial<IGig>): IGig {
  return parseGig({ ...GetDefaults(), ...gig }, (errors) => {
    throw new Error(
      'Setup new gig failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isGig: isCompleteGig,
} as const;
