import {
  isNonEmptyString,
  isNumber,
  isOptionalString,
  isOptionalStringArray,
  isString,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from '@src/models/common/types';

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity freelancer_profiles
 * Dedicated profile document for users in the FREELANCER role.
 */
export interface IFreelancerProfile extends Entity {
  userId: string;
  professionalTitle: string;
  bio?: string;
  skills: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  completedOrders: number;
  level?: string;
  location?: string;
  languages?: string[];
  avgResponseTime?: string;
  portfolioImages?: string[];
}

/******************************************************************************
                                 Constants
******************************************************************************/

const isStringArray = (val: unknown): val is string[] =>
  Array.isArray(val) && val.every((item) => typeof item === 'string');

const GetDefaults = (): IFreelancerProfile => ({
  id: '',
  userId: '',
  professionalTitle: '',
  bio: '',
  skills: [],
  hourlyRate: 0,
  rating: 5.0,
  reviewCount: 0,
  completedOrders: 0,
  level: 'Pro Specialist',
  location: '',
  languages: ['English'],
  avgResponseTime: 'Within 2 hours',
  portfolioImages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IFreelancerProfile> = {
  id: isString,
  userId: isString,
  professionalTitle: isString,
  bio: isOptionalString,
  skills: isStringArray,
  hourlyRate: isNumber,
  rating: isNumber,
  reviewCount: isNumber,
  completedOrders: isNumber,
  level: isOptionalString,
  location: isOptionalString,
  languages: isOptionalStringArray,
  avgResponseTime: isOptionalString,
  portfolioImages: isOptionalStringArray,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

/******************************************************************************
                                  Setup
******************************************************************************/

const parseFreelancerProfile = parseObject<IFreelancerProfile>(schema);

const isCompleteFreelancerProfile = testObject<IFreelancerProfile>({
  ...schema,
  userId: isNonEmptyString,
  professionalTitle: isNonEmptyString,
});

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * New freelancer profile object with default fields.
 */
function new_(
  profile?: Partial<IFreelancerProfile>,
): IFreelancerProfile {
  return parseFreelancerProfile({ ...GetDefaults(), ...profile }, (errors) => {
    throw new Error(
      'Setup new freelancer profile failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteFreelancerProfile,
} as const;
