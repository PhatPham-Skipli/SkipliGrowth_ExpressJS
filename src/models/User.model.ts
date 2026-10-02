import {
  isNonEmptyString,
  isOptionalBoolean,
  isOptionalString,
  isString,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from '@src/models/common/types';

/******************************************************************************
                                  Types
******************************************************************************/

export type UserRole = 'RESTAURANT_OWNER' | 'FREELANCER';

export type AccountStanding =
  | 'GOOD_STANDING'
  | 'UNDER_REVIEW'
  | 'RESTRICTED'
  | 'SUSPENDED';

/**
 * @entity users
 * Core user identity and authentication document.
 */
export interface IUser extends Entity {
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  roles: UserRole[];
  activeRole: UserRole;
  accountStanding?: AccountStanding;
  isBanned?: boolean;
  banReason?: string;
  githubAccessToken?: string;
  githubUsername?: string;
  verificationCode?: string | null;
  verificationCodeExpiresAt?: Date | null;
}

export type IPublicUser = Omit<
  IUser,
  | 'passwordHash'
  | 'verificationCode'
  | 'githubAccessToken'
  | 'verificationCodeExpiresAt'
>;

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): IUser => ({
  id: '',
  email: '',
  passwordHash: '',
  name: '',
  avatarUrl: '',
  bio: '',
  phone: '',
  roles: ['RESTAURANT_OWNER'],
  activeRole: 'RESTAURANT_OWNER',
  accountStanding: 'GOOD_STANDING',
  isBanned: false,
  banReason: '',
  githubAccessToken: '',
  githubUsername: '',
  verificationCode: null,
  verificationCodeExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const isUserRole = (val: unknown): val is UserRole =>
  val === 'RESTAURANT_OWNER' || val === 'FREELANCER';

const isUserRoleArray = (val: unknown): val is UserRole[] =>
  Array.isArray(val) && val.length > 0 && val.every(isUserRole);

const isAccountStanding = (val: unknown): val is AccountStanding | undefined =>
  val === undefined ||
  val === 'GOOD_STANDING' ||
  val === 'UNDER_REVIEW' ||
  val === 'RESTRICTED' ||
  val === 'SUSPENDED';

const schema: Schema<IUser> = {
  id: isString,
  email: isString,
  passwordHash: isOptionalString,
  name: isString,
  avatarUrl: isOptionalString,
  bio: isOptionalString,
  phone: isOptionalString,
  roles: isUserRoleArray,
  activeRole: isUserRole,
  accountStanding: isAccountStanding,
  isBanned: isOptionalBoolean,
  banReason: isOptionalString,
  githubAccessToken: isOptionalString,
  githubUsername: isOptionalString,
  verificationCode: (val: unknown): val is string | null | undefined =>
    val === undefined || val === null || typeof val === 'string',
  verificationCodeExpiresAt: (val: unknown): val is Date | null | undefined =>
    val === undefined || val === null || transformIsDate(val),
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

/******************************************************************************
                                  Setup
******************************************************************************/

// Set the "parseUser" function
const parseUser = parseObject<IUser>(schema);

// For the APIs make sure the right fields are complete
const isCompleteUser = testObject<IUser>({
  ...schema,
  email: isNonEmptyString,
});

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * New user object with default fields.
 */
function new_(user?: Partial<IUser>): IUser {
  return parseUser({ ...GetDefaults(), ...user }, (errors) => {
    throw new Error('Setup new user failed ' + JSON.stringify(errors, null, 2));
  });
}

/**
 * Convert to public user data, omitting sensitive fields.
 */
function toPublic(user: IUser): IPublicUser {
  const {
    passwordHash,
    verificationCode,
    verificationCodeExpiresAt,
    githubAccessToken,
    ...publicData
  } = user;
  return publicData;
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteUser,
  toPublic,
} as const;
