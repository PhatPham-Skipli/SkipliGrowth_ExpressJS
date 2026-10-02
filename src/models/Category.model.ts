import {
  isBoolean,
  isNonEmptyString,
  isNumber,
  isString,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from '@src/models/common/types';

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity categories
 * Represents a hospitality service vertical / category on the Skipli Marketplace.
 */
export interface ICategory extends Entity {
  name: string;
  slug: string;
  tagline: string;
  iconName: string;
  heroImage: string;
  popularSearch: string;
  displayOrder: number;
  isActive: boolean;
}

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): ICategory => ({
  id: '',
  name: '',
  slug: '',
  tagline: '',
  iconName: 'Sparkles',
  heroImage: '',
  popularSearch: '',
  displayOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<ICategory> = {
  id: isString,
  name: isString,
  slug: isString,
  tagline: isString,
  iconName: isString,
  heroImage: isString,
  popularSearch: isString,
  displayOrder: isNumber,
  isActive: isBoolean,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

/******************************************************************************
                                   Setup
******************************************************************************/

const parseCategory = parseObject<ICategory>(schema);

const isCompleteCategory = testObject<ICategory>({
  ...schema,
  name: isNonEmptyString,
  slug: isNonEmptyString,
});

/******************************************************************************
                                  Functions
******************************************************************************/

/**
 * Setup new category object with default values.
 */
function new_(category?: Partial<ICategory>): ICategory {
  return parseCategory({ ...GetDefaults(), ...category }, (errors) => {
    throw new Error(
      'Setup new category failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isCategory: isCompleteCategory,
} as const;
