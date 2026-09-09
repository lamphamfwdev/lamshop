export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  tags: string[];
  featured?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type SortOption = "featured" | "price-asc" | "price-desc" | "name";
