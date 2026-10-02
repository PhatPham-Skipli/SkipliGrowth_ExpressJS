import { Request, Response } from 'express';
import {
  isOptionalNumber,
  isOptionalString,
  isOptionalStringArray,
  isString,
} from 'jet-validators';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  ForbiddenException,
  NotFoundException,
} from '@src/common/exceptions/api.exception';
import {
  IBeforeTransformResponseType,
  IRequestHasUser,
} from '@src/common/types/responses/api.response';
import  {
  IFreelancerProfile,
} from '@src/models/FreelancerProfile.model';
import UserModel, { IPublicUser } from '@src/models/User.model';
import FreelancerProfileRepo from '@src/repos/FreelancerProfileRepo';
import UserRepo from '@src/repos/UserRepo';
import parseReq from '@src/routes/common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  update: parseReq({
    professionalTitle: isOptionalString,
    bio: isOptionalString,
    skills: isOptionalStringArray,
    hourlyRate: isOptionalNumber,
    portfolioImages: isOptionalStringArray,
  }),
  search: parseReq({
    skill: isString,
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get current authenticated user's freelancer profile.
 *
 * @route GET /api/freelancers/profile
 */
async function getMyProfile(
  req: Request,
  res: Response<IBeforeTransformResponseType<IFreelancerProfile | null>>,
) {
  const user = (req as IRequestHasUser).user;
  const profile = await FreelancerProfileRepo.getByUserId(user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved freelancer profile successfully',
    data: profile,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Update current authenticated user's freelancer profile.
 *
 * @route PATCH /api/freelancers/profile
 */
async function updateMyProfile(
  req: Request,
  res: Response<IBeforeTransformResponseType<IFreelancerProfile>>,
) {
  const user = (req as IRequestHasUser).user;

  if (!user.roles.includes('FREELANCER')) {
    throw new ForbiddenException(
      'Only users with FREELANCER role can manage a freelancer profile',
    );
  }

  const parsed = reqValidators.update(req.body);
  const updated = await FreelancerProfileRepo.createOrUpdate({
    userId: user.id,
    professionalTitle: parsed.professionalTitle,
    bio: parsed.bio,
    skills: parsed.skills,
    hourlyRate: parsed.hourlyRate,
    portfolioImages: parsed.portfolioImages,
  });

  return res.status(HttpStatusCodes.OK).json({
    message: 'Updated freelancer profile successfully',
    data: updated,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get public profile of a freelancer by userId.
 *
 * @route GET /api/freelancers/:userId
 */
async function getPublicProfile(
  req: Request,
  res: Response<
    IBeforeTransformResponseType<{
      user: IPublicUser;
      profile: IFreelancerProfile;
    }>
  >,
) {
  const userId = req.params.userId as string;
  const [user, profile] = await Promise.all([
    UserRepo.getById(userId),
    FreelancerProfileRepo.getByUserId(userId),
  ]);

  if (!user || !profile) {
    throw new NotFoundException('Freelancer profile not found');
  }

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved freelancer public profile successfully',
    data: {
      user: UserModel.toPublic(user),
      profile,
    },
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Search freelancers by skill.
 *
 * @route GET /api/freelancers/search?skill=...
 */
async function searchBySkill(
  req: Request,
  res: Response<IBeforeTransformResponseType<IFreelancerProfile[]>>,
) {
  const skill = req.query.skill as string;
  if (!skill) {
    return res.status(HttpStatusCodes.OK).json({
      message: 'No skill specified',
      data: [],
      type: 'response',
      statusCode: HttpStatusCodes.OK,
    });
  }

  const profiles = await FreelancerProfileRepo.searchBySkill(skill);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved freelancers by skill successfully',
    data: profiles,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  searchBySkill,
} as const;
