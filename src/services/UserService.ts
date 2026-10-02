import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { IUser } from '@src/models/User.model';
import UserRepo from '@src/repos/UserRepo';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  USER_NOT_FOUND: 'User not found',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get all users.
 */
function getAll(): Promise<IUser[]> {
  return UserRepo.getAll();
}

/**
 * Search user by email with pagination.
 */
async function searchByEmail(
  email: string,
  page: number,
  pageSize: number,
): Promise<{ items: IUser[]; totalCount: number }> {
  if (!email) {
    return { items: [], totalCount: 0 };
  }
  return UserRepo.searchByEmail(email, page, pageSize);
}

/**
 * Add one user.
 */
function addOne(user: IUser): Promise<void> {
  return UserRepo.add(user);
}

/**
 * Update one user.
 */
async function updateOne(user: IUser): Promise<IUser> {
  const persists = await UserRepo.persists(user.id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.update(user);
}

/**
 * Delete a user by their id.
 */
async function deleteOne(id: string): Promise<void> {
  const persists = await UserRepo.persists(id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.delete(id);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  Errors,
  getAll,
  searchByEmail,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;
