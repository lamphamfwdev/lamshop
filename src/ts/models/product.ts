export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  tags: string[];
  featured?: boolean;
  stock?: number | null;
  status?: "active" | "out-of-stock" | "draft";
}

export type SalesChannel = "facebook" | "instagram" | "zalo-personal" | "zalo-oa" | "tiktok";

export interface PriceFilter {
  id: string;
  label: string;
  minPrice: number | null;
  maxPrice: number | null;
  sortOrder: number;
}

export interface ShopSettings {
  shopName: string;
  logoUrl: string;
  tagline: string;
  pageTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBadgeTitle: string;
  heroBadgeContent: string;
  heroImageUrl: string;
  footerDescription: string;
  address: string;
  phone: string;
  email: string;
  facebookPageName: string;
  facebookPageUsername: string;
  defaultSalesChannel: SalesChannel;
  facebookUrl: string;
  instagramUrl: string;
  zaloPersonalUrl: string;
  zaloOaUrl: string;
  tiktokUrl: string;
  productsPerPage: number;
}

export interface CatalogPayload {
  products: Product[];
  settings: Partial<ShopSettings>;
  priceFilters: PriceFilter[];
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type SortOption = "featured" | "price-asc" | "price-desc" | "name";
