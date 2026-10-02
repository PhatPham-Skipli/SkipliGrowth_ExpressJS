import { FieldValue } from 'firebase-admin/firestore';
import { ServiceCategory } from '@src/models/CategoryFeature.model';
import {
  GigStatus,
  IGig,
  IGigPackage,
} from '@src/models/Gig.model';
import { IUser } from '@src/models/User.model';

import { db } from '../config/firebase';
import UserRepo from './UserRepo';

// ============================================================================
// Firestore Data Converter for Type Safety
// ============================================================================
const gigConverter = {
  toFirestore(gig: IGig): FirebaseFirestore.DocumentData {
    // Ensure seller snapshot is never persisted to the gigs document
    const { seller, ...docData } = gig as unknown as Record<string, unknown>;
    return docData;
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): IGig {
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
      sellerId: typeof raw.sellerId === 'string' ? raw.sellerId : '',
      title: typeof raw.title === 'string' ? raw.title : '',
      slug: typeof raw.slug === 'string' ? raw.slug : snapshot.id,
      category: (raw.category as ServiceCategory) || 'menu-design',
      categoryLabel:
        typeof raw.categoryLabel === 'string'
          ? raw.categoryLabel
          : 'Menu & Visual Identity',
      coverImage: typeof raw.coverImage === 'string' ? raw.coverImage : '',
      galleryImages: Array.isArray(raw.galleryImages)
        ? (raw.galleryImages as string[])
        : [],
      startingPrice:
        typeof raw.startingPrice === 'number' ? raw.startingPrice : 0,
      packages: Array.isArray(raw.packages)
        ? (raw.packages as IGigPackage[])
        : [],
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
      description:
        typeof raw.description === 'string' ? raw.description : '',
      highlights: Array.isArray(raw.highlights)
        ? (raw.highlights as string[])
        : [],
      faqs: Array.isArray(raw.faqs) ? (raw.faqs as any[]) : [],
      status: (raw.status as GigStatus) || 'PUBLISHED',
      rating: typeof raw.rating === 'number' ? raw.rating : 5.0,
      reviewCount:
        typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
      isTopRated: Boolean(raw.isTopRated),
      isBestSeller: Boolean(raw.isBestSeller),
      createdAt: toDate(raw.createdAt) || new Date(),
      updatedAt: toDate(raw.updatedAt) || new Date(),
    };
  },
};

const gigsCollection = db
  .collection('gigs')
  .withConverter(gigConverter);

export interface IGigListFilter {
  category?: string;
  search?: string;
  sellerId?: string;
  status?: string;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get gig by unique ID.
 */
async function getById(id: string): Promise<IGig | null> {
  const snapshot = await gigsCollection.doc(id).get();
  if (!snapshot.exists) return null;
  return snapshot.data() || null;
}

/**
 * Get gig by slug.
 */
async function getBySlug(slug: string): Promise<IGig | null> {
  const snapshot = await gigsCollection
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

/**
 * List gigs with optional filtering.
 */
async function list(filter: IGigListFilter = {}): Promise<IGig[]> {
  let query: FirebaseFirestore.Query<IGig> = gigsCollection;

  if (filter.status) {
    query = query.where('status', '==', filter.status);
  } else {
    query = query.where('status', '==', 'PUBLISHED');
  }

  if (filter.category) {
    query = query.where('category', '==', filter.category);
  }

  if (filter.sellerId) {
    query = query.where('sellerId', '==', filter.sellerId);
  }

  const snapshot = await query.get();
  let results = snapshot.docs.map((doc) => doc.data());

  // In-memory text search if search term provided
  if (filter.search) {
    const term = filter.search.toLowerCase().trim();
    results = results.filter(
      (gig) =>
        gig.title.toLowerCase().includes(term) ||
        gig.tags.some((tag) => tag.toLowerCase().includes(term)) ||
        (gig.description && gig.description.toLowerCase().includes(term)),
    );
  }

  return results;
}

/**
 * Create a new gig document.
 */
async function create(data: Partial<IGig>): Promise<IGig> {
  const docRef = gigsCollection.doc();
  const slug =
    data.slug ||
    (data.title
      ? data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`
      : docRef.id);

  const newGig: IGig = {
    id: docRef.id,
    sellerId: data.sellerId || '',
    title: data.title || '',
    slug,
    category: data.category || 'menu-design',
    categoryLabel: data.categoryLabel || 'Menu & Visual Identity',
    coverImage: data.coverImage || '',
    galleryImages: data.galleryImages || [],
    startingPrice: data.startingPrice || 0,
    packages: data.packages || [],
    tags: data.tags || [],
    description: data.description || '',
    highlights: data.highlights || [],
    faqs: data.faqs || [],
    status: data.status || 'PUBLISHED',
    rating: data.rating || 5.0,
    reviewCount: data.reviewCount || 0,
    isTopRated: Boolean(data.isTopRated),
    isBestSeller: Boolean(data.isBestSeller),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await docRef.set(newGig);
  return newGig;
}

/**
 * Update a gig by ID.
 */
async function update(
  id: string,
  data: Partial<IGig>,
): Promise<IGig | null> {
  const docRef = gigsCollection.doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const updateData = {
    ...data,
    updatedAt: new Date(),
  };

  await docRef.update(updateData);
  const updatedDoc = await docRef.get();
  return updatedDoc.data() || null;
}

/**
 * Soft delete or remove gig by ID.
 */
async function delete_(id: string): Promise<boolean> {
  const docRef = gigsCollection.doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return false;

  await docRef.update({
    status: 'PAUSED',
    updatedAt: new Date(),
    deletedAt: new Date(),
  });
  return true;
}

const DEFAULT_SELLERS: IUser[] = [
  {
    id: 'seller-matteo',
    email: 'matteo.rossi@skipli.growth',
    name: 'Matteo Rossi',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    bio: 'Hospitality Brand & Menu Specialist with 8+ years designing high-impact visual identities for restaurants, bars, and bistros.',
    roles: ['FREELANCER'],
    activeRole: 'FREELANCER',
    accountStanding: 'GOOD_STANDING',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'seller-sarah',
    email: 'sarah.chen@skipli.growth',
    name: 'Sarah Chen',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    bio: 'Next.js F&B Web Engineer building high-converting restaurant direct ordering platforms.',
    roles: ['FREELANCER'],
    activeRole: 'FREELANCER',
    accountStanding: 'GOOD_STANDING',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Seed initial restaurant gigs into Firestore if empty.
 */
async function seedInitialGigsIfEmpty(): Promise<void> {
  try {
    // 1. Ensure initial seller users exist in users collection
    for (const seller of DEFAULT_SELLERS) {
      const exists = await UserRepo.persists(seller.id);
      if (!exists) {
        await UserRepo.add(seller);
      }
    }

    // 2. Clean up deprecated "seller" field stored directly inside existing gigs docs
    const existingGigs = await db.collection('gigs').get();
    if (!existingGigs.empty) {
      const batch = db.batch();
      let hasCleanup = false;
      existingGigs.docs.forEach((doc) => {
        if (doc.data().seller !== undefined) {
          batch.update(doc.ref, { seller: FieldValue.delete() });
          hasCleanup = true;
        }
      });
      if (hasCleanup) {
        await batch.commit();
        console.log('[GigRepo] Removed deprecated embedded seller snapshots from gigs collection.');
      }
      return;
    }

    const initialGigs: Partial<IGig>[] = [
      {
        title:
          'I will design an appetising luxury restaurant menu with print and digital QR code',
        slug: 'luxury-restaurant-menu-qr',
        category: 'menu-design',
        categoryLabel: 'Menu & Visual Identity',
        coverImage:
          'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        ],
        startingPrice: 45,
        rating: 4.96,
        reviewCount: 148,
        isTopRated: true,
        isBestSeller: true,
        sellerId: 'seller-matteo',
        packages: [
          {
            name: 'Basic',
            title: 'Single Page / Drink Menu',
            description:
              'Clean single page or cocktail list in PDF + QR code generator',
            deliveryDays: 2,
            revisions: 2,
            price: 45,
            features: [
              '1 Page Layout',
              'High-res Print PDF',
              'Dynamic QR Code',
              'Source File',
            ],
            structuredFeatures: [
              {
                featureId: 'pages_count',
                name: 'Number of Menu Pages',
                value: 1,
                unit: 'Pages',
              },
              {
                featureId: 'print_ready_pdf',
                name: 'High-Res Print-Ready PDF',
                value: true,
              },
              {
                featureId: 'dynamic_qr',
                name: 'Dynamic QR Code Generator',
                value: true,
              },
              {
                featureId: 'source_files',
                name: 'Editable Vector Source Files',
                value: false,
              },
            ],
          },
          {
            name: 'Standard',
            title: 'Complete Bi-fold Menu',
            description:
              'Appetizers, Mains, Desserts layout with custom food icons and typography',
            deliveryDays: 3,
            revisions: 4,
            price: 85,
            features: [
              'Up to 4 Pages',
              'Custom Vector Icons',
              'TV Digital Screen Ready',
              'Commercial Use',
            ],
            structuredFeatures: [
              {
                featureId: 'pages_count',
                name: 'Number of Menu Pages',
                value: 4,
                unit: 'Pages',
              },
              {
                featureId: 'print_ready_pdf',
                name: 'High-Res Print-Ready PDF',
                value: true,
              },
              {
                featureId: 'dynamic_qr',
                name: 'Dynamic QR Code Generator',
                value: true,
              },
              {
                featureId: 'source_files',
                name: 'Editable Vector Source Files',
                value: true,
              },
              {
                featureId: 'custom_icons',
                name: 'Custom Handcrafted Food Icons',
                value: true,
              },
            ],
          },
          {
            name: 'Premium',
            title: 'Full Dining Brand Identity',
            description:
              'Complete master menu, wine list, table tents & digital screen animation',
            deliveryDays: 5,
            revisions: 'Unlimited',
            price: 150,
            features: [
              'Full Menu Suite',
              'Social Media Templates',
              'Unlimited Revisions',
              'VIP 24/7 Support',
            ],
            structuredFeatures: [
              {
                featureId: 'pages_count',
                name: 'Number of Menu Pages',
                value: 8,
                unit: 'Pages',
              },
              {
                featureId: 'print_ready_pdf',
                name: 'High-Res Print-Ready PDF',
                value: true,
              },
              {
                featureId: 'dynamic_qr',
                name: 'Dynamic QR Code Generator',
                value: true,
              },
              {
                featureId: 'source_files',
                name: 'Editable Vector Source Files',
                value: true,
              },
              {
                featureId: 'custom_icons',
                name: 'Custom Handcrafted Food Icons',
                value: true,
              },
              {
                featureId: 'tv_board_ready',
                name: 'Digital TV Menu Board Layout',
                value: true,
              },
            ],
          },
        ],
        tags: [
          'Menu Design',
          'QR Code',
          'Restaurant Branding',
          'Cocktail Card',
        ],
        status: 'PUBLISHED',
      },
      {
        title:
          'I will build a high-converting restaurant website with direct online ordering system',
        slug: 'restaurant-website-online-ordering',
        category: 'web-ordering',
        categoryLabel: 'Websites & Direct Ordering',
        coverImage:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        ],
        startingPrice: 195,
        rating: 5.0,
        reviewCount: 92,
        isTopRated: true,
        isBestSeller: true,
        sellerId: 'seller-sarah',
        packages: [
          {
            name: 'Basic',
            title: 'Landing Page & Reservation',
            description:
              'Showcase food gallery, opening hours, Google Maps & OpenTable widget',
            deliveryDays: 3,
            revisions: 3,
            price: 195,
            features: [
              'Mobile Responsive',
              'SEO Optimization',
              'Reservation Integration',
              'Fast CDN Hosting',
            ],
            structuredFeatures: [
              {
                featureId: 'pages_count',
                name: 'Website Pages Count',
                value: 1,
                unit: 'Pages',
              },
              {
                featureId: 'mobile_responsive',
                name: 'Mobile & Tablet Responsive',
                value: true,
              },
              {
                featureId: 'online_ordering',
                name: 'Direct Online Ordering',
                value: false,
              },
            ],
          },
          {
            name: 'Standard',
            title: 'Direct Online Ordering',
            description:
              'Pick-up & delivery checkout, menu modifiers, Stripe/Apple Pay integration',
            deliveryDays: 5,
            revisions: 5,
            price: 340,
            features: [
              '0% Commission Ordering',
              'Live Kitchen Notification',
              'Stripe Gateway',
              'SMS Alerts',
            ],
            structuredFeatures: [
              {
                featureId: 'pages_count',
                name: 'Website Pages Count',
                value: 4,
                unit: 'Pages',
              },
              {
                featureId: 'mobile_responsive',
                name: 'Mobile & Tablet Responsive',
                value: true,
              },
              {
                featureId: 'online_ordering',
                name: 'Direct Online Ordering',
                value: true,
              },
              {
                featureId: 'pos_integration',
                name: 'Toast / Square POS Sync',
                value: true,
              },
            ],
          },
          {
            name: 'Premium',
            title: 'Enterprise Multi-Location Chain',
            description:
              'Multi-branch routing, custom customer loyalty rewards, POS webhook sync',
            deliveryDays: 8,
            revisions: 'Unlimited',
            price: 650,
            features: [
              'Multi-Branch Support',
              'Loyalty Program',
              'POS Integration',
              '1-Month Maintenance',
            ],
            structuredFeatures: [
              {
                featureId: 'pages_count',
                name: 'Website Pages Count',
                value: 8,
                unit: 'Pages',
              },
              {
                featureId: 'mobile_responsive',
                name: 'Mobile & Tablet Responsive',
                value: true,
              },
              {
                featureId: 'online_ordering',
                name: 'Direct Online Ordering',
                value: true,
              },
              {
                featureId: 'pos_integration',
                name: 'Toast / Square POS Sync',
                value: true,
              },
              {
                featureId: 'speed_seo',
                name: 'Google PageSpeed 90+',
                value: true,
              },
              {
                featureId: 'free_hosting_mo',
                name: 'Free Cloud Hosting',
                value: 6,
                unit: 'Months',
              },
            ],
          },
        ],
        tags: ['Next.js', 'Online Ordering', 'Stripe', 'Mobile Friendly'],
        status: 'PUBLISHED',
      },
    ];

    const batch = db.batch();
    for (const gigData of initialGigs) {
      const docRef = gigsCollection.doc();
      const gig: IGig = {
        id: docRef.id,
        sellerId: gigData.sellerId || 'seller-system',
        title: gigData.title || '',
        slug: gigData.slug || docRef.id,
        category: gigData.category || 'menu-design',
        categoryLabel: gigData.categoryLabel || 'Menu & Visual Identity',
        coverImage: gigData.coverImage || '',
        galleryImages: gigData.galleryImages || [],
        startingPrice: gigData.startingPrice || 45,
        packages: gigData.packages || [],
        tags: gigData.tags || [],
        description: gigData.description || '',
        highlights: gigData.highlights || [],
        faqs: gigData.faqs || [],
        status: 'PUBLISHED',
        rating: gigData.rating || 5.0,
        reviewCount: gigData.reviewCount || 10,
        isTopRated: gigData.isTopRated,
        isBestSeller: gigData.isBestSeller,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      batch.set(docRef, gig);
    }

    await batch.commit();
    console.log(
      `[GigRepo] Successfully seeded initial ${initialGigs.length} gigs into Firestore.`,
    );
  } catch (error) {
    console.error('[GigRepo] Error seeding initial gigs:', error);
  }
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  getById,
  getBySlug,
  list,
  create,
  update,
  delete: delete_,
  seedInitialGigsIfEmpty,
} as const;
