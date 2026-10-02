import { isDate, isString } from 'jet-validators';
import { transform } from 'jet-validators/utils';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Convert to date object then check is a validate date.
 */
export const transformIsDate = transform(
  (arg) => new Date(arg as string),
  (arg) => isDate(arg),
);

/**
 * Convert to date object then check is a validate date, optional.
 */
export const transformIsOptionalDate = transform(
  (arg) => {
    if (arg === undefined) return undefined;
    if (arg === null) return null;
    return new Date(arg as string);
  },
  (arg) => isDate(arg) || arg === undefined || arg === null,
);

/**
 * Check if string is a valid email format.
 */
export const isEmail = (arg: unknown): arg is string => {
  return (
    isString(arg) &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(arg)
  );
};

/**
 * Check if string, null or undefined.
 */
export const isOptionalNullableString = (arg: unknown): arg is string | null | undefined => {
  return isString(arg) || arg === null || arg === undefined;
};
