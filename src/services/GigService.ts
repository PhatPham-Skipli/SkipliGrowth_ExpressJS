import {
  ForbiddenException,
  NotFoundException,
} from '@src/common/exceptions/api.exception';
import { mapGigUser, mapGigsUser } from '@src/common/utils/mapping-utils';
import { IGigPackage, IGigWithUser } from '@src/models/Gig.model';
import GigRepo, { IGigListFilter } from '@src/repos/GigRepo';

export interface CreateGigDto {
  title: string;
  category: any;
  categoryLabel?: string;
  coverImage?: string;
  galleryImages?: string[];
  packages: IGigPackage[];
  tags?: string[];
  description?: string;
  highlights?: string[];
  faqs?: Array<{ id: string; question: string; answer: string }>;
}

export interface UpdateGigDto extends Partial<CreateGigDto> {
  status?: 'DRAFT' | 'PUBLISHED' | 'PAUSED';
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * List public gigs with mapped user details.
 */
async function list(filter: IGigListFilter = {}): Promise<IGigWithUser[]> {
  const gigs = await GigRepo.list(filter);
  return mapGigsUser(gigs);
}

/**
 * Get gig by ID or slug with mapped user details.
 */
async function getByIdOrSlug(idOrSlug: string): Promise<IGigWithUser | null> {
  let gig = await GigRepo.getById(idOrSlug);
  if (!gig) {
    gig = await GigRepo.getBySlug(idOrSlug);
  }
  if (!gig) {
    return null;
  }
  return mapGigUser(gig);
}

/**
 * Create a new gig published by a freelancer.
 */
async function create(
  sellerId: string,
  dto: CreateGigDto,
): Promise<IGigWithUser> {
  const startingPrice =
    dto.packages && dto.packages.length > 0
      ? Math.min(...dto.packages.map((p) => p.price))
      : 45;

  const newGig = await GigRepo.create({
    sellerId,
    title: dto.title,
    category: dto.category,
    categoryLabel: dto.categoryLabel || 'Menu & Visual Identity',
    coverImage:
      dto.coverImage ||
      'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    galleryImages: dto.galleryImages || [],
    startingPrice,
    packages: dto.packages,
    tags: dto.tags || [],
    description: dto.description || '',
    highlights: dto.highlights || [],
    faqs: dto.faqs || [],
    status: 'PUBLISHED',
  });

  return mapGigUser(newGig);
}

/**
 * Update an existing gig (only by seller).
 */
async function update(
  id: string,
  sellerId: string,
  dto: UpdateGigDto,
): Promise<IGigWithUser> {
  const existing = await GigRepo.getById(id);
  if (!existing) {
    throw new NotFoundException('Gig not found');
  }

  if (existing.sellerId !== sellerId) {
    throw new ForbiddenException('You are not authorized to update this gig');
  }

  const startingPrice =
    dto.packages && dto.packages.length > 0
      ? Math.min(...dto.packages.map((p) => p.price))
      : existing.startingPrice;

  const updated = await GigRepo.update(id, {
    ...dto,
    startingPrice,
  });

  if (!updated) {
    throw new NotFoundException('Gig not found after update');
  }

  return mapGigUser(updated);
}

/**
 * Delete / pause a gig.
 */
async function deleteGig(id: string, sellerId: string): Promise<boolean> {
  const existing = await GigRepo.getById(id);
  if (!existing) {
    throw new NotFoundException('Gig not found');
  }

  if (existing.sellerId !== sellerId) {
    throw new ForbiddenException('You are not authorized to delete this gig');
  }

  return GigRepo.delete(id);
}

/**
 * Get all gigs for a specific freelancer with mapped user details.
 */
async function getMyGigs(sellerId: string): Promise<IGigWithUser[]> {
  const gigs = await GigRepo.list({ sellerId, status: 'PUBLISHED' });
  return mapGigsUser(gigs);
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  list,
  getByIdOrSlug,
  create,
  update,
  delete: deleteGig,
  getMyGigs,
} as const;

