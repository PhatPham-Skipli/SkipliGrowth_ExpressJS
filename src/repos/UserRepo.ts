import { AccountStanding, IUser } from '@src/models/User.model';

import { db } from '../config/firebase';

// ============================================================================
// Firestore Data Converter for Type Safety
// ============================================================================
const userConverter = {
  toFirestore(user: IUser): FirebaseFirestore.DocumentData {
    return user;
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): IUser {
    const raw = snapshot.data();

    const toDate = (val: unknown): Date | null => {
      if (!val) return null;
      if (
        typeof val === 'object' &&
        val !== null &&
        'toDate' in val &&
        typeof (val as { toDate: () => Date }).toDate === 'function'
      ) {
        return (val as { toDate: () => Date }).toDate();
      }
      if (val instanceof Date) return val;
      if (typeof val === 'string' || typeof val === 'number') {
        return new Date(val);
      }
      return null;
    };

    const toAccountStanding = (val: unknown): AccountStanding => {
      if (
        val === 'UNDER_REVIEW' ||
        val === 'RESTRICTED' ||
        val === 'SUSPENDED'
      ) {
        return val;
      }
      return 'GOOD_STANDING';
    };

    const roles =
      Array.isArray(raw.roles) && raw.roles.length > 0
        ? (raw.roles as IUser['roles'])
        : (['RESTAURANT_OWNER'] as IUser['roles']);

    const activeRole =
      (raw.activeRole as IUser['activeRole']) ||
      roles[0] ||
      'RESTAURANT_OWNER';

    return {
      id: snapshot.id,
      email: typeof raw.email === 'string' ? raw.email : '',
      passwordHash:
        typeof raw.passwordHash === 'string' ? raw.passwordHash : '',
      name:
        typeof raw.name === 'string'
          ? raw.name
          : typeof raw.displayName === 'string'
            ? raw.displayName
            : '',
      avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : '',
      bio: typeof raw.bio === 'string' ? raw.bio : '',
      phone: typeof raw.phone === 'string' ? raw.phone : '',
      roles,
      activeRole,
      accountStanding: toAccountStanding(raw.accountStanding),
      isBanned: Boolean(raw.isBanned),
      banReason: typeof raw.banReason === 'string' ? raw.banReason : '',
      githubAccessToken:
        typeof raw.githubAccessToken === 'string' ? raw.githubAccessToken : '',
      githubUsername:
        typeof raw.githubUsername === 'string' ? raw.githubUsername : '',
      verificationCode:
        typeof raw.verificationCode === 'string' ? raw.verificationCode : null,
      verificationCodeExpiresAt: toDate(raw.verificationCodeExpiresAt),
      createdAt: toDate(raw.createdAt) || new Date(),
      updatedAt: toDate(raw.updatedAt) || new Date(),
    };
  },
};

// Typed collection reference
const usersCollection = db.collection('users').withConverter(userConverter);

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get one user by email.
 */
async function getOne(email: string): Promise<IUser | null> {
  try {
    const snapshot = await usersCollection
      .where('email', '==', email)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  } catch {
    throw new Error('Get one user failed');
  }
}

/**
 * Search users by email.
 */
async function searchByEmail(
  email: string,
  page: number,
  pageSize: number,
): Promise<{ items: IUser[]; totalCount: number }> {
  try {
    const query = usersCollection
      .where('email', '>=', email)
      .where('email', '<=', email + '\uf8ff');

    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    const offset = (page - 1) * pageSize;
    const snapshot = await query
      .orderBy('email')
      .offset(offset)
      .limit(pageSize)
      .get();

    const items = snapshot.docs.map((doc) => doc.data());
    return { items, totalCount };
  } catch {
    throw new Error('Search users by email failed');
  }
}

/**
 * Get one user by id.
 */
async function getById(id: string): Promise<IUser | null> {
  try {
    const snapshot = await usersCollection.doc(id).get();
    if (!snapshot.exists) return null;
    return snapshot.data() as IUser;
  } catch {
    throw new Error('Get one user failed');
  }
}

/**
 * Get one user by ids.
 */
async function getByIds(ids: string[]): Promise<IUser[]> {
  if (!ids || ids.length === 0) return [];

  try {
    const refs = ids.map((id) => usersCollection.doc(id));
    const snapshots = await db.getAll(...refs);
    return snapshots
      .filter((doc) => doc.exists)
      .map((doc) => doc.data() as IUser);
  } catch {
    throw new Error('Get users by ids failed');
  }
}

/**
 * See if a user with the given id exists.
 */
async function persists(id: string): Promise<boolean> {
  try {
    const doc = await usersCollection.doc(id).get();
    return doc.exists;
  } catch {
    throw new Error('Persists user failed');
  }
}

/**
 * See if a user with the given email exists.
 */
async function persistsByEmail(email: string): Promise<boolean> {
  try {
    const snapshot = await usersCollection
      .where('email', '==', email)
      .limit(1)
      .get();
    return !snapshot.empty;
  } catch {
    throw new Error('Persists by email failed');
  }
}

/**
 * Get all users.
 */
async function getAll(): Promise<IUser[]> {
  try {
    const snapshot = await usersCollection.get();
    return snapshot.docs.map((doc) => doc.data());
  } catch {
    throw new Error('Get all users failed');
  }
}

/**
 * Add one user.
 */
async function add(user: IUser): Promise<void> {
  try {
    // If user.id is empty, Firestore will auto-generate it if we use .add(),
    // but we use .doc() so we can generate it manually or use provided id
    if (!user.id) {
      user.id = usersCollection.doc().id;
    }
    user.createdAt = new Date();
    user.updatedAt = new Date();
    await usersCollection.doc(user.id).set(user);
  } catch {
    throw new Error('Add user failed');
  }
}

/**
 * Update a user.
 */
async function update(user: Partial<IUser> & { id: string }): Promise<IUser> {
  try {
    user.updatedAt = new Date();
    // using { merge: true } so we don't overwrite unspecified fields
    await usersCollection.doc(user.id).set(user, { merge: true });

    const snapshot = await usersCollection.doc(user.id).get();
    return snapshot.data() as IUser;
  } catch {
    throw new Error('Update user failed');
  }
}

/**
 * Delete one user.
 */
async function delete_(id: string): Promise<void> {
  try {
    await usersCollection.doc(id).delete();
  } catch {
    throw new Error('Delete user failed');
  }
}

// **** Unit-Tests Only **** //

/**
 * @testOnly
 * Delete every user record.
 */
async function deleteAllUsers(): Promise<void> {
  try {
    const snapshot = await usersCollection.get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch {
    throw new Error('Delete all users failed');
  }
}

/**
 * @testOnly
 * Insert multiple users.
 */
async function insertMultiple(
  users: IUser[] | readonly IUser[],
): Promise<IUser[]> {
  const usersF = [...users];
  const batch = db.batch();

  try {
    for (const user of usersF) {
      if (!user.id) {
        user.id = usersCollection.doc().id;
      }
      user.createdAt = new Date();
      user.updatedAt = new Date();
      const docRef = usersCollection.doc(user.id);
      batch.set(docRef, user);
    }
    await batch.commit();
  } catch {
    throw new Error('Insert multiple users failed');
  }
  return usersF;
}

/**
 * Generate a new unique ID for a user document.
 */
function newId(): string {
  return usersCollection.doc().id;
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  newId,
  getOne,
  getById,
  getByIds,
  searchByEmail,
  persists,
  persistsByEmail,
  getAll,
  add,
  update,
  delete: delete_,
  deleteAllUsers,
  insertMultiple,
} as const;
