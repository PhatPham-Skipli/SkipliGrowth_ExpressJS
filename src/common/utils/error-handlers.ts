import { NextFunction, Request, Response } from 'express';
import logger from 'jet-logger';

import EnvVars, { NodeEnvs } from '@src/common/constants/env';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { ApiException } from '@src/common/exceptions/api.exception';
import { RouteError, ValidationError } from '@src/common/utils/route-errors';

export const errorHandler = (
  err: Error,
  _: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (EnvVars.NodeEnv !== NodeEnvs.TEST.valueOf()) {
    logger.err(err, true);
  }

  if (err instanceof ApiException) {
    return res.status(err.statusCode).json(err.getFormatResponse());
  }

  if (err instanceof ValidationError) {
    const apiError = new ApiException(err.message, err.status, err.errors);
    return res.status(apiError.statusCode).json(apiError.getFormatResponse());
  }

  if (err instanceof RouteError) {
    const apiError = new ApiException(err.message, err.status);
    return res.status(apiError.statusCode).json(apiError.getFormatResponse());
  }

  const serverError = new ApiException(
    err.message,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
  );
  return res
    .status(serverError.statusCode)
    .json(serverError.getFormatResponse());
};
