export interface Product {
  id: string;
  name: string;
  brandId: string;
  brand: Brand;
  size: number;
  price: number;
  images: string[];
  concentration: string;
  gender: string;
  description: string;
  descriptionHr?: string | null;
  discountAmount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isSpotlight: boolean;
  isGiftMen: boolean;
  isGiftWomen: boolean;
  stock: number;
  fragranceProfiles: string[];
  fragranceProfilesHr?: string[];
  topNotes: string[];
  topNotesHr?: string[];
  heartNotes: string[];
  heartNotesHr?: string[];
  baseNotes: string[];
  baseNotesHr?: string[];
  /** The original perfume this one is inspired by; null for an original scent. */
  inspiration?: string | null;
  reviewCount?: number;
  averageRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
