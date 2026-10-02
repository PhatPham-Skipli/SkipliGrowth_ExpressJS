import { ParseError } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';

/******************************************************************************
                                 Classes
******************************************************************************/

/**
 * Error with status code and message.
 */
export class RouteError extends Error {
  public status: HttpStatusCodes;

  public constructor(status: HttpStatusCodes, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Handle "parseObj" errors.
 */
export class ValidationError extends RouteError {
  public errors: ParseError[];

  public static MESSAGE = 'Validate fail';

  public constructor(errors: ParseError[]) {
    super(HttpStatusCodes.BAD_REQUEST, ValidationError.MESSAGE);
    this.errors = errors;
  }
}
