import { Request, Response } from 'express';
import { isOptionalString, isString } from 'jet-validators';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  ForbiddenException,
  NotFoundException,
} from '@src/common/exceptions/api.exception';
import {
  IBeforeTransformResponseType,
  IRequestHasUser,
} from '@src/common/types/responses/api.response';
import RestaurantModel, { IRestaurant } from '@src/models/Restaurant.model';
import RestaurantRepo from '@src/repos/RestaurantRepo';
import parseReq from '@src/routes/common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  create: parseReq({
    name: isString,
    type: isString,
    address: isOptionalString,
    phone: isOptionalString,
    logoUrl: isOptionalString,
    coverImageUrl: isOptionalString,
    description: isOptionalString,
  }),
  update: parseReq({
    name: isOptionalString,
    type: isOptionalString,
    address: isOptionalString,
    phone: isOptionalString,
    logoUrl: isOptionalString,
    coverImageUrl: isOptionalString,
    description: isOptionalString,
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get all restaurants owned by the current authenticated user.
 *
 * @route GET /api/restaurants/my
 */
async function getMyRestaurants(
  req: Request,
  res: Response<IBeforeTransformResponseType<IRestaurant[]>>,
) {
  const user = (req as IRequestHasUser).user;
  const restaurants = await RestaurantRepo.getByOwnerId(user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved restaurants successfully',
    data: restaurants,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get restaurant by ID.
 *
 * @route GET /api/restaurants/:id
 */
async function getById(
  req: Request,
  res: Response<IBeforeTransformResponseType<IRestaurant>>,
) {
  const id = req.params.id as string;
  const restaurant = await RestaurantRepo.getById(id);

  if (!restaurant) {
    throw new NotFoundException('Restaurant not found');
  }

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved restaurant successfully',
    data: restaurant,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Create a new restaurant for current owner.
 *
 * @route POST /api/restaurants
 */
async function create(
  req: Request,
  res: Response<IBeforeTransformResponseType<IRestaurant>>,
) {
  const user = (req as IRequestHasUser).user;

  if (!user.roles.includes('RESTAURANT_OWNER')) {
    throw new ForbiddenException(
      'Only users with RESTAURANT_OWNER role can create restaurants',
    );
  }

  const parsed = reqValidators.create(req.body);
  const newRestaurant = RestaurantModel.new({
    ownerId: user.id,
    name: parsed.name,
    type: parsed.type,
    address: parsed.address,
    phone: parsed.phone,
    logoUrl: parsed.logoUrl,
    coverImageUrl: parsed.coverImageUrl,
    description: parsed.description,
  });

  const created = await RestaurantRepo.add(newRestaurant);

  return res.status(HttpStatusCodes.CREATED).json({
    message: 'Created restaurant successfully',
    data: created,
    type: 'response',
    statusCode: HttpStatusCodes.CREATED,
  });
}

/**
 * Update an existing restaurant.
 *
 * @route PATCH /api/restaurants/:id
 */
async function update(
  req: Request,
  res: Response<IBeforeTransformResponseType<IRestaurant>>,
) {
  const user = (req as IRequestHasUser).user;
  const id = req.params.id as string;

  const existing = await RestaurantRepo.getById(id);
  if (!existing) {
    throw new NotFoundException('Restaurant not found');
  }

  if (existing.ownerId !== user.id) {
    throw new ForbiddenException('You do not have permission to modify this restaurant');
  }

  const parsed = reqValidators.update(req.body);
  const updated = await RestaurantRepo.update({
    id,
    ...parsed,
  });

  return res.status(HttpStatusCodes.OK).json({
    message: 'Updated restaurant successfully',
    data: updated,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Delete a restaurant.
 *
 * @route DELETE /api/restaurants/:id
 */
async function delete_(
  req: Request,
  res: Response<IBeforeTransformResponseType<null>>,
) {
  const user = (req as IRequestHasUser).user;
  const id = req.params.id as string;

  const existing = await RestaurantRepo.getById(id);
  if (!existing) {
    throw new NotFoundException('Restaurant not found');
  }

  if (existing.ownerId !== user.id) {
    throw new ForbiddenException('You do not have permission to delete this restaurant');
  }

  await RestaurantRepo.delete(id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Deleted restaurant successfully',
    data: null,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getMyRestaurants,
  getById,
  create,
  update,
  delete: delete_,
} as const;
