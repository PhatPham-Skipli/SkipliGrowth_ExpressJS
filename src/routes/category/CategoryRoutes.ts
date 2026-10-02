import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { IBeforeTransformResponseType } from '@src/common/types/responses/api.response';
import { ICategory } from '@src/models/Category.model';
import {
  ICategoryFeature,
  ServiceCategory,
} from '@src/models/CategoryFeature.model';
import CategoryFeatureRepo from '@src/repos/CategoryFeatureRepo';
import CategoryRepo from '@src/repos/CategoryRepo';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get all active categories sorted by display order.
 *
 * @route GET /api/categories
 */
async function getAll(
  _: Request,
  res: Response<IBeforeTransformResponseType<ICategory[]>>,
) {
  const categories = await CategoryRepo.getAll();

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved categories successfully',
    data: categories,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get category by ID or slug.
 *
 * @route GET /api/categories/:id
 */
async function getById(
  req: Request,
  res: Response<IBeforeTransformResponseType<ICategory | null>>,
) {
  const id = req.params.id as string;
  const category = await CategoryRepo.getById(id);

  if (!category) {
    return res.status(HttpStatusCodes.NOT_FOUND).json({
      message: `Category with ID or slug '${id}' not found`,
      data: null,
      type: 'response',
      statusCode: HttpStatusCodes.NOT_FOUND,
    });
  }

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved category successfully',
    data: category,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get category features.
 * Can filter by query parameter ?category=menu-design
 *
 * @route GET /api/categories/features
 */
async function getFeatures(
  req: Request,
  res: Response<IBeforeTransformResponseType<ICategoryFeature[]>>,
) {
  const category = req.query.category as ServiceCategory | undefined;
  const features = await CategoryFeatureRepo.getAll(category);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved category features successfully',
    data: features,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get category features for a specific category slug.
 *
 * @route GET /api/categories/features/:category
 */
async function getFeaturesByCategory(
  req: Request,
  res: Response<IBeforeTransformResponseType<ICategoryFeature[]>>,
) {
  const category = req.params.category as ServiceCategory;
  const features = await CategoryFeatureRepo.getByCategory(category);

  return res.status(HttpStatusCodes.OK).json({
    message: `Retrieved features for category ${category} successfully`,
    data: features,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  getAll,
  getById,
  getFeatures,
  getFeaturesByCategory,
} as const;
