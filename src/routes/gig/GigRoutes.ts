import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { NotFoundException } from '@src/common/exceptions/api.exception';
import {
  IBeforeTransformResponseType,
  IRequestHasUser,
} from '@src/common/types/responses/api.response';
import { IGigWithUser } from '@src/models/Gig.model';
import GigService, { CreateGigDto, UpdateGigDto } from '@src/services/GigService';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * List public gigs with optional filter.
 *
 * @route GET /api/gigs
 */
async function list(
  req: Request,
  res: Response<IBeforeTransformResponseType<IGigWithUser[]>>,
) {
  const { category, search, sellerId, status } = req.query;
  const gigs = await GigService.list({
    category: category as string,
    search: search as string,
    sellerId: sellerId as string,
    status: status as string,
  });

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved gigs successfully',
    data: gigs,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get gig by ID or slug.
 *
 * @route GET /api/gigs/:idOrSlug
 */
async function getByIdOrSlug(
  req: Request,
  res: Response<IBeforeTransformResponseType<IGigWithUser>>,
) {
  const idOrSlug = req.params.idOrSlug as string;
  const gig = await GigService.getByIdOrSlug(idOrSlug);
  if (!gig) {
    throw new NotFoundException('Restaurant gig not found');
  }

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved gig details successfully',
    data: gig,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Get current freelancer's gigs.
 *
 * @route GET /api/gigs/my/list
 */
async function getMyGigs(
  req: Request,
  res: Response<IBeforeTransformResponseType<IGigWithUser[]>>,
) {
  const user = (req as IRequestHasUser).user;
  const gigs = await GigService.getMyGigs(user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Retrieved your gigs successfully',
    data: gigs,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Create a new gig.
 *
 * @route POST /api/gigs
 */
async function create(
  req: Request,
  res: Response<IBeforeTransformResponseType<IGigWithUser>>,
) {
  const user = (req as IRequestHasUser).user;
  const dto = req.body as CreateGigDto;

  const gig = await GigService.create(user.id, dto);

  return res.status(HttpStatusCodes.CREATED).json({
    message: 'Published restaurant gig successfully',
    data: gig,
    type: 'response',
    statusCode: HttpStatusCodes.CREATED,
  });
}

/**
 * Update an existing gig.
 *
 * @route PUT /api/gigs/:id
 */
async function update(
  req: Request,
  res: Response<IBeforeTransformResponseType<IGigWithUser>>,
) {
  const user = (req as IRequestHasUser).user;
  const id = req.params.id as string;
  const dto = req.body as UpdateGigDto;

  const gig = await GigService.update(id, user.id, dto);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Updated gig successfully',
    data: gig,
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/**
 * Delete a gig.
 *
 * @route DELETE /api/gigs/:id
 */
async function delete_(
  req: Request,
  res: Response<IBeforeTransformResponseType<{ success: boolean }>>,
) {
  const user = (req as IRequestHasUser).user;
  const id = req.params.id as string;

  await GigService.delete(id, user.id);

  return res.status(HttpStatusCodes.OK).json({
    message: 'Gig deleted successfully',
    data: { success: true },
    type: 'response',
    statusCode: HttpStatusCodes.OK,
  });
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  list,
  getByIdOrSlug,
  getMyGigs,
  create,
  update,
  delete: delete_,
} as const;
