import { ICategory } from '@src/models/Category.model';

/**
 * Default predefined hospitality service categories.
 * Automatically seeded into Firestore on server startup if the collection is empty.
 */
export const CATEGORY_PRESETS: Omit<
  ICategory,
  'createdAt' | 'updatedAt'
>[] = [
  {
    id: 'web-ordering',
    slug: 'web-ordering',
    name: 'Websites & Direct Ordering',
    tagline:
      'Custom restaurant websites, QR table ordering & commission-free delivery setup',
    iconName: 'Globe',
    heroImage:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    popularSearch: 'Online ordering website',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'menu-design',
    slug: 'menu-design',
    name: 'Menu & Visual Identity',
    tagline:
      'Mouth-watering menu layouts, digital TV boards, table tents & brand logos',
    iconName: 'BookOpen',
    heroImage:
      'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    popularSearch: 'Cocktail & food menu',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'local-marketing',
    slug: 'local-marketing',
    name: 'Local SEO & Foot-Traffic Ads',
    tagline:
      'Google Maps #1 ranking, geo-targeted Meta ads, local influencer campaigns',
    iconName: 'MapPin',
    heroImage:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    popularSearch: 'Google Maps ranking',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'photo-video',
    slug: 'photo-video',
    name: 'Food Photo & Viral Reels',
    tagline:
      'High-res dish photography, TikTok kitchen behind-the-scenes & story promo',
    iconName: 'Camera',
    heroImage:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    popularSearch: 'Food photography & video',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'ops-support',
    slug: 'ops-support',
    name: 'POS & Restaurant Operations',
    tagline:
      'Toast & Square POS setup, recipe food costing, menu entry & inventory audits',
    iconName: 'Settings',
    heroImage:
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80',
    popularSearch: 'Toast POS menu integration',
    displayOrder: 5,
    isActive: true,
  },
];
