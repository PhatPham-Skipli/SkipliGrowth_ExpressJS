import { Request, Response } from 'express';
import { isString } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  IBeforeTransformPaginationResponseType,
  IBeforeTransformResponseType,
} from '@src/common/types/responses/api.response';
import User, { IPublicUser } from '@src/models/User.model';
import UserService from '@src/services/UserService';

import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  add: parseReq({ user: User.isComplete }),
  update: parseReq({ user: User.isComplete }),
  delete: parseReq({ id: transform(String, isString) }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get all users.
 *
 * @route GET /api/users/all
 */
async function getAll(
  _: Request,
  res: Response<IBeforeTransformResponseType<IPublicUser[]>>,
) {
  const users = await UserService.getAll();
  const publicUsers = users.map(User.toPublic);
  return res.status(HttpStatusCodes.OK).json({
    message: 'Get all user success',
    data: publicUsers,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Search user by email with pagination.
 *
 * @route GET /api/users/search
 */
async function searchByEmail(
  req: Request,
  res: Response<IBeforeTransformPaginationResponseType<IPublicUser>>,
) {
  const email = (req.query.email as string) || '';
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.limit) || 10;

  const data = await UserService.searchByEmail(email, page, pageSize);
  const items = data.items.map(User.toPublic);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Search user by email success',
    data: {
      items,
      totalCount: data.totalCount,
      currentPage: page,
      pageSize,
    },
    type: 'pagination',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Add one user.
 *
 * @route POST /api/users/add
 */
async function add(
  req: Request,
  res: Response<IBeforeTransformResponseType<null>>,
) {
  const { user } = reqValidators.add(req.body);
  await UserService.addOne(user);
  return res.status(HttpStatusCodes.CREATED).json({
    message: 'Add user success',
    data: null,
    type: 'response',
    statusCode: HttpStatusCodes.CREATED,
  });
}

/**
 * Update one user.
 *
 * @route PUT /api/users/update
 */
async function update(
  req: Request,
  res: Response<IBeforeTransformResponseType<null>>,
) {
  const { user } = reqValidators.update(req.body);
  await UserService.updateOne(user);
  return res.status(HttpStatusCodes.OK).json({
    message: 'Update user success',
    data: null,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Delete one user.
 *
 * @route DELETE /api/users/delete/:id
 */
async function delete_(
  req: Request,
  res: Response<IBeforeTransformResponseType<null>>,
) {
  const { id } = reqValidators.delete(req.params);
  await UserService.delete(id);
  return res.status(HttpStatusCodes.OK).json({
    message: 'Delete user success',
    data: null,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getAll,
  searchByEmail,
  add,
  update,
  delete: delete_,
} as const;
