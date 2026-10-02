import { NextFunction, Request, Response } from 'express';

import {
  IBeforeTransformPaginationResponseType,
  IBeforeTransformResponseType,
  IPaginationResponseType,
  IResponseType,
} from '../types/responses/api.response';

/**
 * Middleware to format API responses to match IResponseType or IPaginationResponseType
 */
export const responseFormatter = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json;

  // Override res.json to format the response body
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.json = function (body: any) {
    if (body && typeof body === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (body.type === 'response') {
        const responseBody = body as IBeforeTransformResponseType;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedResponse: IResponseType<any> = {
          statusCode: responseBody.statusCode || res.statusCode,
          message: responseBody.message || 'Success',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: responseBody.data,
          date: new Date(),
        };
        return originalJson.call(this, formattedResponse);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (body.type === 'pagination') {
        const paginationBody = body as IBeforeTransformPaginationResponseType;
        const { items, totalCount, currentPage, pageSize } =
          paginationBody.data;
        const totalPage = Math.ceil(totalCount / pageSize);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedPagination: IPaginationResponseType<any> = {
          statusCode: paginationBody.statusCode || res.statusCode,
          message: paginationBody.message || 'Success',
          data: {
            items,
            totalCount,
            totalPage,
            currentPage,
            pageSize,
            hasNextPage: currentPage * pageSize < totalCount,
            hasPreviousPage: currentPage > 1,
          },
          date: new Date(),
        };
        return originalJson.call(this, formattedPagination);
      }
    }

    // Return original body if it doesn't match our transformation targets
    return originalJson.call(this, body);
  };

  next();
};
