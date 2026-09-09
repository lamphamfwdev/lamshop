import { SHOP_CONFIG } from "./config/shop.config.js";
import { PRODUCTS } from "./data/products.js";
import { CartService } from "./services/cart.service.js";
import { renderProductCard } from "./ui/product-card.js";
import { escapeHtml, formatPrice, normalizeText } from "./utils/format.js";
const cart = new CartService();
let selectedCategory = "Tất cả";
let query = "";
let maximumPrice = null;
let sortOption = "featured";
let toastTimer;
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Không tìm thấy phần tử #${id}`);
    return element;
};
const productList = getElement("product-list");
const categoryList = getElement("category-list");
const resultCount = getElement("result-count");
const emptyState = getElement("empty-state");
const cartDialog = getElement("cart-dialog");
const cartItems = getElement("cart-items");
const cartEmpty = getElement("cart-empty");
const cartSummary = getElement("cart-summary");
const cartCount = getElement("cart-count");
const toast = getElement("toast");
const categories = ["Tất cả", ...new Set(PRODUCTS.map((product) => product.category))];
const applyShopInformation = () => {
    document.title = `${SHOP_CONFIG.name} · Sản phẩm chọn lọc`;
    getElement("shop-name").textContent = SHOP_CONFIG.name;
    getElement("footer-shop-name").textContent = SHOP_CONFIG.name;
    getElement("copyright-shop-name").textContent = SHOP_CONFIG.name;
    getElement("shop-description").textContent = SHOP_CONFIG.shortDescription;
    getElement("footer-description").textContent = SHOP_CONFIG.shortDescription;
    getElement("shop-address").textContent = SHOP_CONFIG.address;
    getElement("shop-phone").textContent = SHOP_CONFIG.phone;
    getElement("shop-phone").href = `tel:${SHOP_CONFIG.phone.replace(/\s/g, "")}`;
    getElement("shop-email").textContent = SHOP_CONFIG.email;
    getElement("shop-email").href = `mailto:${SHOP_CONFIG.email}`;
    getElement("facebook-link").textContent = `${SHOP_CONFIG.facebookPageName} →`;
    getElement("facebook-link").href = messengerUrl();
    getElement("current-year").textContent = String(new Date().getFullYear());
};
const renderCategories = () => {
    categoryList.innerHTML = categories
        .map((category) => `
        <button
          class="category-chip ${category === selectedCategory ? "is-active" : ""}"
          type="button"
          data-category="${escapeHtml(category)}"
          aria-pressed="${category === selectedCategory}"
        >${escapeHtml(category)}</button>
      `)
        .join("");
};
const getVisibleProducts = () => {
    const normalizedQuery = normalizeText(query);
    const filtered = PRODUCTS.filter((product) => {
        const searchTarget = normalizeText([product.id, product.name, product.description, product.category, ...product.tags].join(" "));
        const matchesSearch = !normalizedQuery || searchTarget.includes(normalizedQuery);
        const matchesCategory = selectedCategory === "Tất cả" || product.category === selectedCategory;
        const matchesPrice = maximumPrice === null || product.price <= maximumPrice;
        return matchesSearch && matchesCategory && matchesPrice;
    });
    return filtered.sort((a, b) => {
        if (sortOption === "price-asc")
            return a.price - b.price;
        if (sortOption === "price-desc")
            return b.price - a.price;
        if (sortOption === "name")
            return a.name.localeCompare(b.name, "vi");
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
};
const renderProducts = () => {
    const products = getVisibleProducts();
    productList.innerHTML = products.map(renderProductCard).join("");
    resultCount.textContent = `${products.length} sản phẩm`;
    emptyState.hidden = products.length > 0;
    productList.hidden = products.length === 0;
    productList.querySelectorAll("img").forEach((image) => {
        image.addEventListener("error", () => image.closest(".product-image-wrap")?.classList.add("image-error"));
    });
};
const renderCart = () => {
    const items = cart.getItems();
    cartCount.textContent = String(cart.count());
    cartCount.classList.toggle("has-items", cart.count() > 0);
    cartEmpty.hidden = items.length > 0;
    cartSummary.hidden = items.length === 0;
    cartItems.innerHTML = items
        .map((item) => {
        const product = PRODUCTS.find((entry) => entry.id === item.productId);
        if (!product)
            return "";
        return `
        <article class="cart-item">
          <img src="${escapeHtml(product.image)}" alt="" width="72" height="72" />
          <div class="cart-item-info">
            <strong>${escapeHtml(product.name)}</strong>
            <span>${formatPrice(product.price)}</span>
            <div class="quantity-control" aria-label="Số lượng ${escapeHtml(product.name)}">
              <button type="button" data-decrease="${product.id}" aria-label="Giảm số lượng">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-increase="${product.id}" aria-label="Tăng số lượng">+</button>
            </div>
          </div>
          <button class="remove-item" type="button" data-remove="${product.id}" aria-label="Xóa ${escapeHtml(product.name)}">×</button>
        </article>
      `;
    })
        .join("");
    getElement("cart-total").textContent = formatPrice(cart.total(PRODUCTS));
};
const showToast = (message) => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    toastTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
        window.setTimeout(() => (toast.hidden = true), 200);
    }, 2400);
};
const openCart = () => {
    renderCart();
    cartDialog.hidden = false;
    document.body.classList.add("dialog-open");
    getElement("close-cart").focus();
};
const closeCart = () => {
    cartDialog.hidden = true;
    document.body.classList.remove("dialog-open");
    getElement("cart-button").focus();
};
const createOrderText = () => {
    const now = new Date();
    const orderCode = `DH${now.toISOString().slice(0, 10).replace(/-/g, "")}-${String(now.getTime()).slice(-4)}`;
    const lines = cart.getItems().flatMap((item, index) => {
        const product = PRODUCTS.find((entry) => entry.id === item.productId);
        if (!product)
            return [];
        return [`${index + 1}. ${product.name} (${product.id})`, `   ${item.quantity} × ${formatPrice(product.price)}`];
    });
    return [
        `Xin chào ${SHOP_CONFIG.name}, tôi muốn đặt đơn ${orderCode}:`,
        "",
        ...lines,
        "",
        `Tổng tạm tính: ${formatPrice(cart.total(PRODUCTS))}`,
        "Vui lòng xác nhận giúp tôi. Cảm ơn shop!"
    ].join("\n");
};
const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    }
    catch {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        document.execCommand("copy");
        area.remove();
    }
};
const messengerUrl = () => `https://m.me/${encodeURIComponent(SHOP_CONFIG.facebookPageUsername)}`;
const copyOrder = async (openMessenger) => {
    if (cart.count() === 0)
        return;
    await copyText(createOrderText());
    if (openMessenger) {
        if (SHOP_CONFIG.facebookPageUsername === "YOUR_PAGE_USERNAME") {
            showToast("Đã copy đơn. Hãy cập nhật username fanpage trong file cấu hình.");
            return;
        }
        showToast("Đã copy đơn, đang mở Messenger…");
        window.open(messengerUrl(), "_blank", "noopener,noreferrer");
    }
    else {
        showToast("Đã copy nội dung đơn hàng.");
    }
};
document.addEventListener("click", (event) => {
    const target = event.target;
    const addButton = target.closest("[data-add-to-cart]");
    const categoryButton = target.closest("[data-category]");
    const decreaseButton = target.closest("[data-decrease]");
    const increaseButton = target.closest("[data-increase]");
    const removeButton = target.closest("[data-remove]");
    if (addButton?.dataset.addToCart) {
        cart.add(addButton.dataset.addToCart);
        renderCart();
        showToast("Đã thêm sản phẩm vào giỏ.");
    }
    if (categoryButton?.dataset.category) {
        selectedCategory = categoryButton.dataset.category;
        renderCategories();
        renderProducts();
    }
    if (decreaseButton?.dataset.decrease) {
        const item = cart.getItems().find((entry) => entry.productId === decreaseButton.dataset.decrease);
        if (item)
            cart.updateQuantity(item.productId, item.quantity - 1);
        renderCart();
    }
    if (increaseButton?.dataset.increase) {
        const item = cart.getItems().find((entry) => entry.productId === increaseButton.dataset.increase);
        if (item)
            cart.updateQuantity(item.productId, item.quantity + 1);
        renderCart();
    }
    if (removeButton?.dataset.remove) {
        cart.remove(removeButton.dataset.remove);
        renderCart();
    }
});
getElement("search-input").addEventListener("input", (event) => {
    query = event.target.value;
    renderProducts();
});
getElement("price-filter").addEventListener("change", (event) => {
    const value = event.target.value;
    maximumPrice = value === "all" ? null : Number(value);
    renderProducts();
});
getElement("sort-select").addEventListener("change", (event) => {
    sortOption = event.target.value;
    renderProducts();
});
getElement("cart-button").addEventListener("click", openCart);
getElement("close-cart").addEventListener("click", closeCart);
getElement("continue-shopping").addEventListener("click", closeCart);
getElement("copy-order").addEventListener("click", () => void copyOrder(false));
getElement("messenger-order").addEventListener("click", () => void copyOrder(true));
getElement("reset-filter").addEventListener("click", () => {
    selectedCategory = "Tất cả";
    query = "";
    maximumPrice = null;
    getElement("search-input").value = "";
    getElement("price-filter").value = "all";
    renderCategories();
    renderProducts();
});
getElement("filter-toggle").addEventListener("click", () => {
    const filters = getElement("filters");
    const isOpen = filters.classList.toggle("is-open");
    getElement("filter-toggle").setAttribute("aria-expanded", String(isOpen));
});
cartDialog.addEventListener("click", (event) => {
    if (event.target === cartDialog)
        closeCart();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cartDialog.hidden)
        closeCart();
});
applyShopInformation();
renderCategories();
renderProducts();
renderCart();
