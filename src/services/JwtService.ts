import jsonwebtoken, { SignOptions } from 'jsonwebtoken';

import EnvVars from '@src/common/constants/env';

export interface IJwtPayload {
  userId: string;
  [key: string]: unknown;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Encrypt data and return jwt.
 */
function sign(data: string | Buffer | object): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: SignOptions = {
      expiresIn: EnvVars.Jwt.Exp as SignOptions['expiresIn'],
    };
    jsonwebtoken.sign(data, EnvVars.Jwt.Secret, options, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token || '');
      }
    });
  });
}

/**
 * Convenience method to sign an access token with a specific userId.
 */
function signAccessToken(userId: string): Promise<string> {
  return sign({ userId });
}

/**
 * Decrypt JWT and extract client data.
 */
function verify<T>(jwt: string): Promise<T> {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(jwt, EnvVars.Jwt.Secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as T);
      }
    });
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  sign,
  signAccessToken,
  verify,
} as const;
