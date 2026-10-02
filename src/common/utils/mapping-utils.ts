import { IGigSellerSnapshot } from '@src/models/Gig.model';
import UserModel, { IPublicUser } from '@src/models/User.model';
import UserRepo from '@src/repos/UserRepo';

/**
 * Maps a public user object into an existing data object based on a user ID field.
 */
export async function mapUserData<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any>,
  K extends string,
>(
  data: T,
  userIdField: keyof T,
  targetKey: K,
): Promise<T & Record<K, IPublicUser | null>> {
  if (!data) {
    return data;
  }

  const userId = data[userIdField] as string | undefined;

  if (!userId) {
    return { ...data, [targetKey]: null };
  }

  const user = await UserRepo.getById(userId);

  if (!user) {
    return { ...data, [targetKey]: null };
  }

  const publicUser = UserModel.toPublic(user);

  return { ...data, [targetKey]: publicUser };
}

/**
 * Maps public user objects into an array of existing data objects.
 * Uses a map to optimize multiple lookups for the same user.
 */
export async function mapUserDataArray<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any>,
  K extends string,
>(
  dataArray: T[],
  userIdField: keyof T,
  targetKey: K,
): Promise<Array<T & Record<K, IPublicUser | null>>> {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(
      dataArray.map((item) => item[userIdField] as string).filter(Boolean),
    ),
  );

  const usersData = await UserRepo.getByIds(userIds);
  const userMap = new Map<string, IPublicUser>();

  for (const user of usersData) {
    userMap.set(user.id.toString(), UserModel.toPublic(user));
  }

  return dataArray.map((item) => {
    const userId = item[userIdField] as string | undefined;
    const publicUser = userId ? userMap.get(userId.toString()) || null : null;
    return { ...item, [targetKey]: publicUser };
  });
}

/**
 * Helper to build a seller view snapshot derived from user data.
 */
export function buildSellerSnapshotFromUser(
  user: IPublicUser | null,
  fallbackSellerId = '',
): IGigSellerSnapshot {
  return {
    id: user?.id || fallbackSellerId,
    name: user?.name || 'Hospitality Specialist',
    avatar:
      user?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    level: 'Pro Specialist',
    specialty: user?.bio || 'Hospitality & Growth Specialist',
    location: 'United States',
    rating: 5.0,
    reviewCount: 0,
  };
}

/**
 * Maps user data from users collection into a single gig document.
 */
export async function mapGigUser<T extends { sellerId: string }>(
  gig: T,
): Promise<T & { user: IPublicUser | null; seller: IGigSellerSnapshot }> {
  const withUser = await mapUserData(gig, 'sellerId', 'user');
  const seller = buildSellerSnapshotFromUser(withUser.user, gig.sellerId);

  return {
    ...withUser,
    seller,
  };
}

/**
 * Maps user data from users collection into an array of gig documents.
 */
export async function mapGigsUser<T extends { sellerId: string }>(
  gigs: T[],
): Promise<Array<T & { user: IPublicUser | null; seller: IGigSellerSnapshot }>> {
  const withUsers = await mapUserDataArray(gigs, 'sellerId', 'user');

  return withUsers.map((item) => ({
    ...item,
    seller: buildSellerSnapshotFromUser(item.user, item.sellerId),
  }));
}

