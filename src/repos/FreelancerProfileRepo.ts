import { IFreelancerProfile } from '@src/models/FreelancerProfile.model';

import { db } from '../config/firebase';

// ============================================================================
// Firestore Data Converter for Type Safety
// ============================================================================
const freelancerProfileConverter = {
  toFirestore(
    profile: IFreelancerProfile,
  ): FirebaseFirestore.DocumentData {
    return profile;
  },
  fromFirestore(
    snapshot: FirebaseFirestore.QueryDocumentSnapshot,
  ): IFreelancerProfile {
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
      userId: typeof raw.userId === 'string' ? raw.userId : snapshot.id,
      professionalTitle:
        typeof raw.professionalTitle === 'string' ? raw.professionalTitle : '',
      bio: typeof raw.bio === 'string' ? raw.bio : '',
      skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : [],
      hourlyRate: typeof raw.hourlyRate === 'number' ? raw.hourlyRate : 0,
      rating: typeof raw.rating === 'number' ? raw.rating : 5.0,
      reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
      completedOrders:
        typeof raw.completedOrders === 'number' ? raw.completedOrders : 0,
      level: typeof raw.level === 'string' ? raw.level : 'Pro Specialist',
      location: typeof raw.location === 'string' ? raw.location : '',
      portfolioImages: Array.isArray(raw.portfolioImages)
        ? (raw.portfolioImages as string[])
        : [],
      createdAt: toDate(raw.createdAt) || new Date(),
      updatedAt: toDate(raw.updatedAt) || new Date(),
    };
  },
};

const profilesCollection = db
  .collection('freelancer_profiles')
  .withConverter(freelancerProfileConverter);

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Get freelancer profile by userId (the document ID matches the userId).
 */
async function getByUserId(
  userId: string,
): Promise<IFreelancerProfile | null> {
  try {
    const snapshot = await profilesCollection.doc(userId).get();
    if (!snapshot.exists) return null;
    return snapshot.data() as IFreelancerProfile;
  } catch {
    throw new Error('Get freelancer profile failed');
  }
}

/**
 * Create or update a freelancer profile.
 */
async function createOrUpdate(
  profile: Partial<IFreelancerProfile> & { userId: string },
): Promise<IFreelancerProfile> {
  try {
    profile.id = profile.userId;
    profile.updatedAt = new Date();

    const existing = await profilesCollection.doc(profile.userId).get();
    if (!existing.exists) {
      profile.createdAt = new Date();
      profile.rating = profile.rating ?? 5.0;
      profile.reviewCount = profile.reviewCount ?? 0;
      profile.completedOrders = profile.completedOrders ?? 0;
      profile.skills = profile.skills ?? [];
      profile.hourlyRate = profile.hourlyRate ?? 0;
      profile.bio = profile.bio ?? '';
      profile.professionalTitle = profile.professionalTitle ?? '';
      profile.portfolioImages = profile.portfolioImages ?? [];
    }

    await profilesCollection
      .doc(profile.userId)
      .set(profile, { merge: true });

    const snapshot = await profilesCollection.doc(profile.userId).get();
    return snapshot.data() as IFreelancerProfile;
  } catch {
    throw new Error('Save freelancer profile failed');
  }
}

/**
 * Search freelancers by skill using Firestore array-contains.
 */
async function searchBySkill(
  skill: string,
  limit = 20,
): Promise<IFreelancerProfile[]> {
  try {
    const snapshot = await profilesCollection
      .where('skills', 'array-contains', skill)
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  } catch {
    throw new Error('Search freelancer profiles by skill failed');
  }
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getByUserId,
  createOrUpdate,
  searchBySkill,
} as const;
