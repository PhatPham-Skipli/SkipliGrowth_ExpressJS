/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get a random number between 1 and 1,000,000,000,000
 */
export function getRandomInt(): number {
  return Math.floor(Math.random() * 1_000_000_000_000);
}

/**
 * Generate a random 6-character alphanumeric verification code.
 */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
