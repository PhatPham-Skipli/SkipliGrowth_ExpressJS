import { CATEGORY_PRESETS } from '@src/common/constants/categoryPresets';
import { ICategory } from '@src/models/Category.model';

import { db } from '../config/firebase';

// ============================================================================
// Firestore Data Converter for Type Safety
// ============================================================================
const categoryConverter = {
  toFirestore(category: ICategory): FirebaseFirestore.DocumentData {
    return category;
  },
  fromFirestore(
    snapshot: FirebaseFirestore.QueryDocumentSnapshot,
  ): ICategory {
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
      name: typeof raw.name === 'string' ? raw.name : '',
      slug: typeof raw.slug === 'string' ? raw.slug : snapshot.id,
      tagline: typeof raw.tagline === 'string' ? raw.tagline : '',
      iconName: typeof raw.iconName === 'string' ? raw.iconName : 'Sparkles',
      heroImage: typeof raw.heroImage === 'string' ? raw.heroImage : '',
      popularSearch:
        typeof raw.popularSearch === 'string' ? raw.popularSearch : '',
      displayOrder:
        typeof raw.displayOrder === 'number' ? raw.displayOrder : 0,
      isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
      createdAt: toDate(raw.createdAt) || new Date(),
      updatedAt: toDate(raw.updatedAt) || new Date(),
    };
  },
};

const categoriesCollection = db
  .collection('categories')
  .withConverter(categoryConverter);

// In-memory cache to minimize Firestore reads
let inMemoryCache: ICategory[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * List all active categories sorted by display order.
 */
async function getAll(forceRefresh = false): Promise<ICategory[]> {
  const now = Date.now();
  if (
    !forceRefresh &&
    inMemoryCache &&
    now - lastCacheTime < CACHE_TTL_MS
  ) {
    return inMemoryCache.filter((cat) => cat.isActive);
  }

  const snapshot = await categoriesCollection
    .where('isActive', '==', true)
    .get();

  const categories = snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => a.displayOrder - b.displayOrder);

  inMemoryCache = categories;
  lastCacheTime = now;

  return categories;
}

/**
 * Get category by ID.
 */
async function getById(id: string): Promise<ICategory | null> {
  const docRef = categoriesCollection.doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    // Fallback: check by slug
    return getBySlug(id);
  }
  return snapshot.data() || null;
}

/**
 * Get category by unique slug.
 */
async function getBySlug(slug: string): Promise<ICategory | null> {
  const snapshot = await categoriesCollection
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

/**
 * Create a new category (Admin).
 */
async function create(
  category: Omit<ICategory, 'id' | 'createdAt' | 'updatedAt'>,
  customId?: string,
): Promise<ICategory> {
  const docRef = customId
    ? categoriesCollection.doc(customId)
    : categoriesCollection.doc();

  const newCategory: ICategory = {
    ...category,
    id: docRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await docRef.set(newCategory);
  inMemoryCache = null; // Invalidate cache
  return newCategory;
}

/**
 * Update an existing category by ID.
 */
async function update(
  id: string,
  data: Partial<ICategory>,
): Promise<ICategory | null> {
  const docRef = categoriesCollection.doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  await docRef.update(updateData);
  inMemoryCache = null; // Invalidate cache

  const updatedDoc = await docRef.get();
  return updatedDoc.data() || null;
}

/**
 * Seed default categories into Firestore if collection is empty.
 */
async function seedDefaultCategoriesIfEmpty(): Promise<void> {
  try {
    const existing = await categoriesCollection.limit(1).get();
    if (!existing.empty) {
      return; // Already seeded
    }

    const batch = db.batch();
    for (const preset of CATEGORY_PRESETS) {
      const docRef = categoriesCollection.doc(preset.id || preset.slug);
      const category: ICategory = {
        ...preset,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      batch.set(docRef, category);
    }

    await batch.commit();
    inMemoryCache = null;
    console.log(
      `[CategoryRepo] Successfully seeded ${CATEGORY_PRESETS.length} default categories into Firestore.`,
    );
  } catch (error) {
    console.error(
      '[CategoryRepo] Error seeding default categories:',
      error,
    );
  }
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  getAll,
  getById,
  getBySlug,
  create,
  update,
  seedDefaultCategoriesIfEmpty,
} as const;
