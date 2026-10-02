import { CATEGORY_FEATURE_PRESETS } from '@src/common/constants/categoryFeaturePresets';
import {
  FeatureValueType,
  ICategoryFeature,
  ITierValueMap,
  ServiceCategory,
} from '@src/models/CategoryFeature.model';

import { db } from '../config/firebase';

// ============================================================================
// Firestore Data Converter for Type Safety
// ============================================================================
const categoryFeatureConverter = {
  toFirestore(feature: ICategoryFeature): FirebaseFirestore.DocumentData {
    return feature;
  },
  fromFirestore(
    snapshot: FirebaseFirestore.QueryDocumentSnapshot,
  ): ICategoryFeature {
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
      category: (raw.category as ServiceCategory) || 'menu-design',
      name: typeof raw.name === 'string' ? raw.name : '',
      code: typeof raw.code === 'string' ? raw.code : '',
      description: typeof raw.description === 'string' ? raw.description : '',
      valueType: (raw.valueType as FeatureValueType) || 'boolean',
      unit: typeof raw.unit === 'string' ? raw.unit : '',
      isCore: typeof raw.isCore === 'boolean' ? raw.isCore : true,
      displayOrder: typeof raw.displayOrder === 'number' ? raw.displayOrder : 0,
      isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
      defaultTierValues: raw.defaultTierValues as ITierValueMap | undefined,
      createdAt: toDate(raw.createdAt) || new Date(),
      updatedAt: toDate(raw.updatedAt) || new Date(),
    };
  },
};

const featuresCollection = db
  .collection('category_features')
  .withConverter(categoryFeatureConverter);

// In-memory cache to minimize Firestore reads
let inMemoryCache: ICategoryFeature[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * List all active category features, optionally filtered by category.
 */
async function getAll(
  category?: ServiceCategory,
  forceRefresh = false,
): Promise<ICategoryFeature[]> {
  const now = Date.now();
  if (
    !forceRefresh &&
    inMemoryCache &&
    now - lastCacheTime < CACHE_TTL_MS
  ) {
    if (category) {
      return inMemoryCache.filter(
        (f) => f.category === category && f.isActive,
      );
    }
    return inMemoryCache.filter((f) => f.isActive);
  }

  const snapshot = await featuresCollection
    .where('isActive', '==', true)
    .get();

  const features = snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => a.displayOrder - b.displayOrder);

  inMemoryCache = features;
  lastCacheTime = now;

  if (category) {
    return features.filter((f) => f.category === category);
  }
  return features;
}

/**
 * Get category features for a specific service category.
 */
async function getByCategory(
  category: ServiceCategory,
): Promise<ICategoryFeature[]> {
  return getAll(category);
}

/**
 * Create a new category feature (Admin).
 */
async function create(
  feature: Omit<ICategoryFeature, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ICategoryFeature> {
  const docRef = featuresCollection.doc();
  const newFeature: ICategoryFeature = {
    ...feature,
    id: docRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await docRef.set(newFeature);
  inMemoryCache = null; // Invalidate cache
  return newFeature;
}

/**
 * Update a category feature by ID.
 */
async function update(
  id: string,
  data: Partial<ICategoryFeature>,
): Promise<ICategoryFeature | null> {
  const docRef = featuresCollection.doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const updatedData = {
    ...data,
    updatedAt: new Date(),
  };

  await docRef.update(updatedData);
  inMemoryCache = null; // Invalidate cache

  const updatedDoc = await docRef.get();
  return updatedDoc.data() || null;
}

/**
 * Seed default presets into Firestore if collection is empty.
 */
async function seedDefaultFeaturesIfEmpty(): Promise<void> {
  try {
    const existing = await featuresCollection.limit(1).get();
    if (!existing.empty) {
      return; // Already seeded
    }

    const batch = db.batch();
    for (const preset of CATEGORY_FEATURE_PRESETS) {
      const docRef = featuresCollection.doc();
      const feature: ICategoryFeature = {
        ...preset,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      batch.set(docRef, feature);
    }

    await batch.commit();
    inMemoryCache = null;
    console.log(
      `[CategoryFeatureRepo] Successfully seeded ${CATEGORY_FEATURE_PRESETS.length} default category features.`,
    );
  } catch (error) {
    console.error(
      '[CategoryFeatureRepo] Error seeding default category features:',
      error,
    );
  }
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  getAll,
  getByCategory,
  create,
  update,
  seedDefaultFeaturesIfEmpty,
} as const;
