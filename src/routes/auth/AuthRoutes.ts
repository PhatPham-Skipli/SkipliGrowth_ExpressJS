import { Request, Response } from 'express';
import {
  isOptionalNumber,
  isOptionalString,
  isOptionalStringArray,
  isString,
} from 'jet-validators';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  IBeforeTransformResponseType,
  IRequestHasUser,
} from '@src/common/types/responses/api.response';
import { isEmail } from '@src/common/utils/validators';
import {
  IPublicUser,
  UserRole,
} from '@src/models/User.model';
import AuthService, {
  IAuthResponse,
  IMeResponse,
  ISigninDto,
  ISignupDto,
} from '@src/services/AuthService';

import parseReq from '../common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const isUserRole = (val: unknown): val is UserRole =>
  val === 'RESTAURANT_OWNER' || val === 'FREELANCER';

const reqValidators = {
  signup: parseReq({
    email: isEmail,
    password: isString,
    name: isOptionalString,
    avatarUrl: isOptionalString,
    bio: isOptionalString,
    phone: isOptionalString,
    role: (val: unknown): val is UserRole | undefined =>
      val === undefined || isUserRole(val),
    restaurantName: isOptionalString,
    restaurantType: isOptionalString,
    restaurantCity: isOptionalString,
    restaurantAddress: isOptionalString,
    restaurantPhone: isOptionalString,
    restaurantWebsiteUrl: isOptionalString,
    restaurantDescription: isOptionalString,
    professionalTitle: isOptionalString,
    skills: isOptionalStringArray,
    hourlyRate: isOptionalNumber,
    location: isOptionalString,
    languages: isOptionalStringArray,
  }),
  signin: parseReq({
    email: isEmail,
    password: isString,
  }),
  switchRole: parseReq({
    role: isUserRole,
  }),
  addRole: parseReq({
    role: isUserRole,
    restaurantName: isOptionalString,
    restaurantType: isOptionalString,
    restaurantCity: isOptionalString,
    restaurantAddress: isOptionalString,
    restaurantPhone: isOptionalString,
    restaurantWebsiteUrl: isOptionalString,
    restaurantDescription: isOptionalString,
    professionalTitle: isOptionalString,
    bio: isOptionalString,
    skills: isOptionalStringArray,
    hourlyRate: isOptionalNumber,
    location: isOptionalString,
    languages: isOptionalStringArray,
  }),
  github: parseReq({
    code: isString,
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Signup with email and password.
 *
 * @route POST /api/auth/signup
 */
async function signup(
  req: Request,
  res: Response<IBeforeTransformResponseType<IAuthResponse>>,
) {
  const parsed = reqValidators.signup(req.body);
  const dto: ISignupDto = {
    email: parsed.email,
    password: parsed.password,
    name: parsed.name,
    avatarUrl: parsed.avatarUrl,
    bio: parsed.bio,
    phone: parsed.phone,
    role: parsed.role,
    restaurantName: parsed.restaurantName,
    restaurantType: parsed.restaurantType,
    restaurantCity: parsed.restaurantCity,
    restaurantAddress: parsed.restaurantAddress,
    restaurantPhone: parsed.restaurantPhone,
    restaurantWebsiteUrl: parsed.restaurantWebsiteUrl,
    restaurantDescription: parsed.restaurantDescription,
    professionalTitle: parsed.professionalTitle,
    skills: parsed.skills,
    hourlyRate: parsed.hourlyRate,
    location: parsed.location,
    languages: parsed.languages,
  };

  const responseData = await AuthService.signup(dto);

  return res.status(HttpStatusCodes.CREATED).json({
    message: 'Signup successful',
    data: responseData,
    type: 'response',
    statusCode: HttpStatusCodes.CREATED,
  });
}

/**
 * Signin with email and password.
 *
 * @route POST /api/auth/signin
 */
async function signin(
  req: Request,
  res: Response<IBeforeTransformResponseType<IAuthResponse>>,
) {
  const parsed = reqValidators.signin(req.body);
  const dto: ISigninDto = {
    email: parsed.email,
    password: parsed.password,
  };

  const responseData = await AuthService.signin(dto);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Signin successful',
    data: responseData,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get current authenticated user profile, restaurants, and freelancer profile.
 *
 * @route GET /api/auth/me
 */
async function me(
  req: Request,
  res: Response<IBeforeTransformResponseType<IMeResponse>>,
) {
  const user = (req as IRequestHasUser).user;
  const meData = await AuthService.getMe(user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'User retrieved successfully',
    data: meData,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Switch active role between RESTAURANT_OWNER and FREELANCER.
 *
 * @route POST /api/auth/switch-role
 */
async function switchRole(
  req: Request,
  res: Response<IBeforeTransformResponseType<IPublicUser>>,
) {
  const { role } = reqValidators.switchRole(req.body);
  const user = (req as IRequestHasUser).user;

  const publicUser = await AuthService.switchRole(user.id, role);

  return res.status(HttpStatusCodes.OK).json({
    message: `Switched active role to ${role} successfully`,
    data: publicUser,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Add a second role to the user account.
 *
 * @route POST /api/auth/add-role
 */
async function addRole(
  req: Request,
  res: Response<IBeforeTransformResponseType<IMeResponse>>,
) {
  const parsed = reqValidators.addRole(req.body);
  const user = (req as IRequestHasUser).user;

  const meData = await AuthService.addRole(
    user.id,
    parsed.role,
    {
      restaurantName: parsed.restaurantName,
      restaurantType: parsed.restaurantType,
      restaurantCity: parsed.restaurantCity,
      restaurantAddress: parsed.restaurantAddress,
      restaurantPhone: parsed.restaurantPhone,
      restaurantWebsiteUrl: parsed.restaurantWebsiteUrl,
      restaurantDescription: parsed.restaurantDescription,
      professionalTitle: parsed.professionalTitle,
      bio: parsed.bio,
      skills: parsed.skills,
      hourlyRate: parsed.hourlyRate,
      location: parsed.location,
      languages: parsed.languages,
    },
  );

  return res.status(HttpStatusCodes.OK).json({
    message: `Added role ${parsed.role} successfully`,
    data: meData,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Logout authenticated user.
 *
 * @route POST /api/auth/logout
 */
function logout(
  _req: Request,
  res: Response<IBeforeTransformResponseType<null>>,
) {
  return res.status(HttpStatusCodes.OK).json({
    message: 'Logged out successfully',
    data: null,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Init Github Auth URL.
 *
 * @route GET /api/auth/github/init
 */
function githubInit(
  _req: Request,
  res: Response<IBeforeTransformResponseType<{ url: string }>>,
) {
  const url = AuthService.getGithubAuthUrl();

  return res.status(HttpStatusCodes.OK).json({
    message: 'Github auth URL generated',
    data: { url },
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Authenticate with Github code.
 *
 * @route POST /api/auth/github
 */
async function github(
  req: Request,
  res: Response<IBeforeTransformResponseType<IAuthResponse>>,
) {
  const { code } = reqValidators.github(req.body);
  const responseData = await AuthService.authWithGithub(code);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Github authentication successful',
    data: responseData,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Link Github account to current authenticated user.
 *
 * @route POST /api/auth/github/link
 */
async function linkGithub(
  req: Request,
  res: Response<IBeforeTransformResponseType<IPublicUser>>,
) {
  const { code } = reqValidators.github(req.body);
  const user = (req as IRequestHasUser).user;

  const publicUser = await AuthService.linkGithub(user.id, code);

  return res.status(HttpStatusCodes.OK).json({
    message: 'GitHub account linked successfully',
    data: publicUser,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Unlink Github account from current authenticated user.
 *
 * @route POST /api/auth/github/unlink
 */
async function unlinkGithub(
  req: Request,
  res: Response<IBeforeTransformResponseType<IPublicUser>>,
) {
  const user = (req as IRequestHasUser).user;
  const publicUser = await AuthService.unlinkGithub(user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'GitHub account unlinked successfully',
    data: publicUser,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  signup,
  signin,
  me,
  switchRole,
  addRole,
  logout,
  githubInit,
  github,
  linkGithub,
  unlinkGithub,
} as const;
