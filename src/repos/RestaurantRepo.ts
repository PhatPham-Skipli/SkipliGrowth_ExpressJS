import { IRestaurant } from '@src/models/Restaurant.model';

import { db } from '../config/firebase';

// ============================================================================
// Firestore Data Converter for Type Safety
// ============================================================================
const restaurantConverter = {
  toFirestore(restaurant: IRestaurant): FirebaseFirestore.DocumentData {
    return restaurant;
  },
  fromFirestore(
    snapshot: FirebaseFirestore.QueryDocumentSnapshot,
  ): IRestaurant {
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

    return {
      id: snapshot.id,
      ownerId: typeof raw.ownerId === 'string' ? raw.ownerId : '',
      name: typeof raw.name === 'string' ? raw.name : '',
      type: typeof raw.type === 'string' ? raw.type : '',
      address: typeof raw.address === 'string' ? raw.address : '',
      city: typeof raw.city === 'string' ? raw.city : '',
      phone: typeof raw.phone === 'string' ? raw.phone : '',
      websiteUrl: typeof raw.websiteUrl === 'string' ? raw.websiteUrl : '',
      logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : '',
      coverImageUrl:
        typeof raw.coverImageUrl === 'string' ? raw.coverImageUrl : '',
      description:
        typeof raw.description === 'string' ? raw.description : '',
      createdAt: toDate(raw.createdAt) || new Date(),
      updatedAt: toDate(raw.updatedAt) || new Date(),
    };
  },
};

const restaurantsCollection = db
  .collection('restaurants')
  .withConverter(restaurantConverter);

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Get one restaurant by id.
 */
async function getById(id: string): Promise<IRestaurant | null> {
  try {
    const snapshot = await restaurantsCollection.doc(id).get();
    if (!snapshot.exists) return null;
    return snapshot.data() as IRestaurant;
  } catch {
    throw new Error('Get restaurant by id failed');
  }
}

/**
 * Get all restaurants owned by a specific user.
 */
async function getByOwnerId(ownerId: string): Promise<IRestaurant[]> {
  try {
    const snapshot = await restaurantsCollection
      .where('ownerId', '==', ownerId)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  } catch {
    throw new Error('Get restaurants by owner failed');
  }
}

/**
 * Add a new restaurant.
 */
async function add(restaurant: IRestaurant): Promise<IRestaurant> {
  try {
    if (!restaurant.id) {
      restaurant.id = restaurantsCollection.doc().id;
    }
    restaurant.createdAt = new Date();
    restaurant.updatedAt = new Date();
    await restaurantsCollection.doc(restaurant.id).set(restaurant);
    return restaurant;
  } catch {
    throw new Error('Add restaurant failed');
  }
}

/**
 * Update an existing restaurant.
 */
async function update(
  restaurant: Partial<IRestaurant> & { id: string },
): Promise<IRestaurant> {
  try {
    restaurant.updatedAt = new Date();
    await restaurantsCollection
      .doc(restaurant.id)
      .set(restaurant, { merge: true });
    const snapshot = await restaurantsCollection.doc(restaurant.id).get();
    return snapshot.data() as IRestaurant;
  } catch {
    throw new Error('Update restaurant failed');
  }
}

/**
 * Delete a restaurant.
 */
async function delete_(id: string): Promise<void> {
  try {
    await restaurantsCollection.doc(id).delete();
  } catch {
    throw new Error('Delete restaurant failed');
  }
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getById,
  getByOwnerId,
  add,
  update,
  delete: delete_,
} as const;
