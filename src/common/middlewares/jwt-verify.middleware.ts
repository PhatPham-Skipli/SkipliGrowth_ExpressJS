import { NextFunction, Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { IDecodedToken } from '@src/common/types/jwt';
import { IRequestHasUser } from '@src/common/types/responses/api.response';
import UserRepo from '@src/repos/UserRepo';
import JwtService from '@src/services/JwtService';

/**
 * Middleware to verify JWT token from request headers
 */
export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(HttpStatusCodes.UNAUTHORIZED).json({
      message: 'Unauthorized',
      data: null,
      type: 'response',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  const decodedToken = await JwtService.verify<IDecodedToken>(token);
  const user = await UserRepo.getById(decodedToken.userId);
  if (!user) {
    return res.status(HttpStatusCodes.UNAUTHORIZED).json({
      message: 'Unauthorized',
      data: null,
      type: 'response',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  }

  if (user.isBanned) {
    return res.status(HttpStatusCodes.FORBIDDEN).json({
      message:
        user.banReason ||
        'Your account has been suspended or banned. Please contact support.',
      data: null,
      type: 'response',
      statusCode: HttpStatusCodes.FORBIDDEN,
    });
  }

  (req as IRequestHasUser).user = user;
  next();
};

/**
 * Middleware to check if the authenticated user is banned
 */
export const checkAccountBanned = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as IRequestHasUser).user;
  if (user && user.isBanned) {
    return res.status(HttpStatusCodes.FORBIDDEN).json({
      message:
        user.banReason ||
        'Your account has been suspended or banned. Please contact support.',
      data: null,
      type: 'response',
      statusCode: HttpStatusCodes.FORBIDDEN,
    });
  }
  next();
};

