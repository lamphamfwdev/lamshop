const STORAGE_KEY = "lam-shop-cart";
export class CartService {
    items = this.load();
    getItems() {
        return this.items.map((item) => ({ ...item }));
    }
    add(productId) {
        const existing = this.items.find((item) => item.productId === productId);
        if (existing)
            existing.quantity += 1;
        else
            this.items.push({ productId, quantity: 1 });
        this.save();
    }
    updateQuantity(productId, quantity) {
        if (quantity <= 0)
            this.remove(productId);
        else {
            const item = this.items.find((entry) => entry.productId === productId);
            if (item)
                item.quantity = quantity;
            this.save();
        }
    }
    remove(productId) {
        this.items = this.items.filter((item) => item.productId !== productId);
        this.save();
    }
    count() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
    total(products) {
        return this.items.reduce((total, item) => {
            const product = products.find((entry) => entry.id === item.productId);
            return total + (product?.price ?? 0) * item.quantity;
        }, 0);
    }
    load() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return value ? JSON.parse(value) : [];
        }
        catch {
            return [];
        }
    }
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    }
}
