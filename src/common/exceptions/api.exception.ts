import HttpStatusCodes from '../constants/HttpStatusCodes';
import { IResponseType } from '../types/responses/api.response';

/**
 * Custom Exception class to format error responses
 */
export class ApiException extends Error {
  public statusCode: HttpStatusCodes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any;

  constructor(
    message: string,
    statusCode: HttpStatusCodes = HttpStatusCodes.INTERNAL_SERVER_ERROR,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.data = data;
    this.name = 'ApiException';

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiException);
    }
  }

  /**
   * Format the error response to match IResponseType
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getFormatResponse(): IResponseType<any> {
    return {
      message: this.message,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: this.data,
      statusCode: this.statusCode,
      date: new Date(),
    };
  }
}

/**
 * Exception for 404 Not Found errors.
 * Indicates that the requested resource could not be found.
 */
export class NotFoundException extends ApiException {
  constructor(
    message = 'Resource not found',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any = null,
  ) {
    super(message, HttpStatusCodes.NOT_FOUND, data);
    this.name = 'NotFoundException';
  }
}

/**
 * Exception for 401 Unauthorized errors.
 * Indicates that the user is not authenticated or lacks valid credentials.
 */
export class UnauthorizedException extends ApiException {
  constructor(
    message = 'Unauthorized',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any = null,
  ) {
    super(message, HttpStatusCodes.UNAUTHORIZED, data);
    this.name = 'UnauthorizedException';
  }
}

/**
 * Exception for 403 Forbidden errors.
 * Indicates that the user is authenticated but does not have permission to access the resource.
 */
export class ForbiddenException extends ApiException {
  constructor(
    message = 'Forbidden',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any = null,
  ) {
    super(message, HttpStatusCodes.FORBIDDEN, data);
    this.name = 'ForbiddenException';
  }
}

/**
 * Exception for 400 Bad Request errors.
 * Indicates that the request was malformed or invalid.
 */
export class BadRequestException extends ApiException {
  constructor(
    message = 'Bad Request',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any = null,
  ) {
    super(message, HttpStatusCodes.BAD_REQUEST, data);
    this.name = 'BadRequestException';
  }
}

/**
 * Exception for 409 Conflict errors.
 * Indicates that the request could not be processed because of a conflict, such as a resource already existing.
 */
export class ConflictException extends ApiException {
  constructor(
    message = 'Conflict / Already exists',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any = null,
  ) {
    super(message, HttpStatusCodes.CONFLICT, data);
    this.name = 'ConflictException';
  }
}

/**
 * Exception for 500 Internal Server errors.
 * Indicates that an unexpected condition was encountered by the server.
 */
export class InternalServerException extends ApiException {
  constructor(
    message = 'Internal Server Error',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any = null,
  ) {
    super(message, HttpStatusCodes.INTERNAL_SERVER_ERROR, data);
    this.name = 'InternalServerException';
  }
}
