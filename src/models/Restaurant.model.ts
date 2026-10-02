import {
  isNonEmptyString,
  isOptionalString,
  isString,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from '@src/models/common/types';

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity restaurants
 * Represents a restaurant owned by a restaurant owner.
 * Allows a single owner to have multiple restaurants.
 */
export interface IRestaurant extends Entity {
  ownerId: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  phone?: string;
  websiteUrl?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
}

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): IRestaurant => ({
  id: '',
  ownerId: '',
  name: '',
  type: '',
  address: '',
  city: '',
  phone: '',
  websiteUrl: '',
  logoUrl: '',
  coverImageUrl: '',
  description: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IRestaurant> = {
  id: isString,
  ownerId: isString,
  name: isString,
  type: isString,
  address: isOptionalString,
  city: isOptionalString,
  phone: isOptionalString,
  websiteUrl: isOptionalString,
  logoUrl: isOptionalString,
  coverImageUrl: isOptionalString,
  description: isOptionalString,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

/******************************************************************************
                                  Setup
******************************************************************************/

const parseRestaurant = parseObject<IRestaurant>(schema);

const isCompleteRestaurant = testObject<IRestaurant>({
  ...schema,
  ownerId: isNonEmptyString,
  name: isNonEmptyString,
});

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * New restaurant object with default fields.
 */
function new_(restaurant?: Partial<IRestaurant>): IRestaurant {
  return parseRestaurant({ ...GetDefaults(), ...restaurant }, (errors) => {
    throw new Error(
      'Setup new restaurant failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteRestaurant,
} as const;
