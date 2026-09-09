import type { CartItem, Product } from "../models/product.js";

const STORAGE_KEY = "lam-shop-cart";

export class CartService {
  private items: CartItem[] = this.load();

  getItems(): CartItem[] {
    return this.items.map((item) => ({ ...item }));
  }

  add(productId: string): void {
    const existing = this.items.find((item) => item.productId === productId);
    if (existing) existing.quantity += 1;
    else this.items.push({ productId, quantity: 1 });
    this.save();
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) this.remove(productId);
    else {
      const item = this.items.find((entry) => entry.productId === productId);
      if (item) item.quantity = quantity;
      this.save();
    }
  }

  remove(productId: string): void {
    this.items = this.items.filter((item) => item.productId !== productId);
    this.save();
  }

  count(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  total(products: Product[]): number {
    return this.items.reduce((total, item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return total + (product?.price ?? 0) * item.quantity;
    }, 0);
  }

  private load(): CartItem[] {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? (JSON.parse(value) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }
}
