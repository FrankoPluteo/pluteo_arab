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
  discountAmount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  stock: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
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