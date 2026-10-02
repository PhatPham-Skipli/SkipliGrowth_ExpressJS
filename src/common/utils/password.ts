import bcrypt from 'bcryptjs';

/******************************************************************************
                                Constants
******************************************************************************/

const SALT_ROUNDS = 10;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Hash a plain text password using bcrypt.
 *
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password against a bcrypt hash.
 *
 * @param password - Plain text password
 * @param hash - Hashed password stored in database
 * @returns True if password matches hash, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export default {
  hashPassword,
  comparePassword,
} as const;
