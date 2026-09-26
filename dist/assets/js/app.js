import { CATALOG_CONFIG, SHOP_CONFIG } from "./config/shop.config.js";
import { PRODUCTS as FALLBACK_PRODUCTS } from "./data/products.generated.js";
import { CartService } from "./services/cart.service.js";
import { loadRemoteCatalog } from "./services/catalog.service.js";
import { renderProductCard } from "./ui/product-card.js";
import { escapeHtml, formatPrice, normalizeText, optimizeImageUrl } from "./utils/format.js";
const cart = new CartService();
let products = [...FALLBACK_PRODUCTS];
let settings = {
    shopName: SHOP_CONFIG.name, logoUrl: "", tagline: "Chọn nhanh · Đặt dễ",
    pageTitle: `${SHOP_CONFIG.name} · Sản phẩm chọn lọc`, metaDescription: SHOP_CONFIG.shortDescription,
    heroEyebrow: "SẢN PHẨM NỔI BẬT", heroTitle: "Không cần tìm lâu, món phù hợp ở ngay đây",
    heroDescription: SHOP_CONFIG.shortDescription, heroBadgeTitle: "Mua sắm rõ ràng",
    heroBadgeContent: "Giá luôn hiển thị minh bạch", heroImageUrl: "",
    footerDescription: SHOP_CONFIG.shortDescription, address: SHOP_CONFIG.address,
    phone: SHOP_CONFIG.phone, email: SHOP_CONFIG.email, facebookPageName: SHOP_CONFIG.facebookPageName,
    facebookPageUsername: SHOP_CONFIG.facebookPageUsername, defaultSalesChannel: "facebook",
    facebookUrl: "", instagramUrl: "", zaloPersonalUrl: "", zaloOaUrl: "", tiktokUrl: "",
    productsPerPage: CATALOG_CONFIG.productsPerPage
};
let priceFilters = [
    { id: "under-200", label: "Dưới 200.000đ", minPrice: null, maxPrice: 200000, sortOrder: 1 },
    { id: "under-500", label: "Dưới 500.000đ", minPrice: null, maxPrice: 500000, sortOrder: 2 },
    { id: "under-1000", label: "Dưới 1.000.000đ", minPrice: null, maxPrice: 1000000, sortOrder: 3 }
];
let selectedCategory = "Tất cả";
let selectedPriceFilterId = "all";
let query = "";
let sortOption = "featured";
let currentPage = 1;
let toastTimer;
let activeDetailProductId = "";
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Không tìm thấy phần tử #${id}`);
    return element;
};
const setText = (id, value) => { getElement(id).textContent = value; };
const productList = getElement("product-list");
const categoryList = getElement("category-list");
const resultCount = getElement("result-count");
const emptyState = getElement("empty-state");
const pagination = getElement("pagination");
const cartDialog = getElement("cart-dialog");
const productDialog = getElement("product-dialog");
const cartItems = getElement("cart-items");
const cartEmpty = getElement("cart-empty");
const cartSummary = getElement("cart-summary");
const cartCount = getElement("cart-count");
const toast = getElement("toast");
const catalogStatus = getElement("catalog-status");
const channelLabels = {
    facebook: "Messenger", instagram: "Instagram", "zalo-personal": "Zalo cá nhân", "zalo-oa": "Zalo OA", tiktok: "TikTok"
};
const getSalesChannel = () => {
    const channel = settings.defaultSalesChannel || "facebook";
    const urls = {
        facebook: settings.facebookUrl || (settings.facebookPageUsername && settings.facebookPageUsername !== "YOUR_PAGE_USERNAME" ? `https://m.me/${encodeURIComponent(settings.facebookPageUsername)}` : "https://www.facebook.com/"),
        instagram: settings.instagramUrl, "zalo-personal": settings.zaloPersonalUrl,
        "zalo-oa": settings.zaloOaUrl, tiktok: settings.tiktokUrl
    };
    return { label: channelLabels[channel] || "kênh đặt hàng", url: urls[channel] || urls.facebook };
};
const applyShopInformation = () => {
    document.title = settings.pageTitle || settings.shopName;
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
        meta.content = settings.metaDescription;
    setText("shop-name", settings.shopName);
    setText("header-tagline", settings.tagline);
    setText("footer-shop-name", settings.shopName);
    setText("copyright-shop-name", settings.shopName);
    setText("hero-eyebrow", settings.heroEyebrow);
    setText("page-title", settings.heroTitle);
    setText("shop-description", settings.heroDescription);
    setText("hero-badge-title", settings.heroBadgeTitle);
    setText("hero-badge-content", settings.heroBadgeContent);
    setText("footer-description", settings.footerDescription);
    setText("shop-address", settings.address);
    setText("current-year", String(new Date().getFullYear()));
    const heroVisual = getElement("hero-visual");
    heroVisual.style.backgroundImage = settings.heroImageUrl ? `linear-gradient(90deg, #111 0%, rgba(17,17,17,.05) 45%), url("${settings.heroImageUrl.replace(/"/g, "%22")}")` : "";
    const phone = getElement("shop-phone");
    phone.textContent = settings.phone;
    phone.href = settings.phone ? `tel:${settings.phone.replace(/\s/g, "")}` : "#";
    phone.closest("li")?.toggleAttribute("hidden", !settings.phone);
    const email = getElement("shop-email");
    email.textContent = settings.email;
    email.href = settings.email ? `mailto:${settings.email}` : "#";
    email.closest("li")?.toggleAttribute("hidden", !settings.email);
    const channel = getSalesChannel();
    const channelLink = getElement("sales-channel-link");
    channelLink.textContent = `${channel.label} của shop →`;
    channelLink.href = channel.url;
    setText("channel-note", `Nội dung đơn sẽ được copy trước khi mở ${channel.label}.`);
    setText("channel-order", `Copy & mở ${channel.label}`);
    const logo = getElement("shop-logo");
    const mark = getElement("brand-mark");
    const footerLogo = getElement("footer-logo");
    const footerMark = getElement("footer-brand-mark");
    if (settings.logoUrl) {
        [logo, footerLogo].forEach((image) => { image.src = settings.logoUrl; image.alt = `Logo ${settings.shopName}`; image.hidden = false; });
        mark.hidden = true;
        footerMark.hidden = true;
    }
    else {
        logo.hidden = true;
        footerLogo.hidden = true;
        mark.hidden = false;
        footerMark.hidden = false;
        mark.textContent = settings.shopName.trim().charAt(0).toUpperCase() || "L";
        footerMark.textContent = mark.textContent;
    }
};
const getCategories = () => ["Tất cả", ...new Set(products.map((p) => p.category).filter(Boolean))];
const renderCategories = () => {
    const categories = getCategories();
    if (!categories.includes(selectedCategory))
        selectedCategory = "Tất cả";
    categoryList.innerHTML = categories.map((category) => `<button class="category-chip ${category === selectedCategory ? "is-active" : ""}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === selectedCategory}">${escapeHtml(category)}</button>`).join("");
    getElement("hero-category-links").innerHTML = categories.slice(1, 6).map((category) => `<button type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");
};
const renderPriceFilters = () => {
    const select = getElement("price-filter");
    const sorted = [...priceFilters].sort((a, b) => a.sortOrder - b.sortOrder);
    select.innerHTML = ['<option value="all">Tất cả mức giá</option>', ...sorted.map((f) => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.label)}</option>`)].join("");
    if (!sorted.some((f) => f.id === selectedPriceFilterId))
        selectedPriceFilterId = "all";
    select.value = selectedPriceFilterId;
};
const matchesPrice = (p) => { const f = priceFilters.find((x) => x.id === selectedPriceFilterId); return !f || ((f.minPrice === null || p.price >= f.minPrice) && (f.maxPrice === null || p.price < f.maxPrice)); };
const getVisibleProducts = () => {
    const q = normalizeText(query);
    return products.filter((p) => (!q || normalizeText([p.id, p.name, p.description, p.category, ...p.tags].join(" ")).includes(q)) && (selectedCategory === "Tất cả" || p.category === selectedCategory) && matchesPrice(p))
        .sort((a, b) => sortOption === "price-asc" ? a.price - b.price : sortOption === "price-desc" ? b.price - a.price : sortOption === "name" ? a.name.localeCompare(b.name, "vi") : Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
};
const visiblePageNumbers = (total) => {
    if (total <= 7)
        return Array.from({ length: total }, (_, i) => i + 1);
    const valid = [...new Set([1, total, currentPage - 1, currentPage, currentPage + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result = [];
    valid.forEach((p, i) => { const previous = valid[i - 1]; if (previous !== undefined && p - previous > 1)
        result.push("ellipsis"); result.push(p); });
    return result;
};
const renderPagination = (totalPages, total) => {
    if (!total || totalPages <= 1) {
        pagination.hidden = true;
        pagination.innerHTML = "";
        return;
    }
    pagination.hidden = false;
    const pages = visiblePageNumbers(totalPages).map((p) => p === "ellipsis" ? '<span class="pagination-ellipsis">…</span>' : `<button type="button" data-page="${p}" class="page-button ${p === currentPage ? "is-active" : ""}" aria-current="${p === currentPage ? "page" : "false"}">${p}</button>`).join("");
    pagination.innerHTML = `<button type="button" class="page-button page-direction" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>← Trước</button><div class="page-numbers">${pages}</div><button type="button" class="page-button page-direction" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Sau →</button>`;
};
const renderProducts = () => {
    const visible = getVisibleProducts();
    const perPage = Math.max(1, Number(settings.productsPerPage) || CATALOG_CONFIG.productsPerPage);
    const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * perPage;
    const page = visible.slice(start, start + perPage);
    productList.innerHTML = page.map(renderProductCard).join("");
    resultCount.textContent = visible.length ? `${start + 1}–${start + page.length} trong ${visible.length} sản phẩm` : "0 sản phẩm";
    emptyState.hidden = visible.length > 0;
    productList.hidden = visible.length === 0;
    renderPagination(totalPages, visible.length);
    productList.querySelectorAll("img").forEach((img) => img.addEventListener("error", () => img.closest(".product-image-wrap")?.classList.add("image-error")));
};
const renderCart = () => {
    const items = cart.getItems();
    cartCount.textContent = String(cart.count());
    cartCount.classList.toggle("has-items", cart.count() > 0);
    cartEmpty.hidden = items.length > 0;
    cartSummary.hidden = items.length === 0;
    cartItems.innerHTML = items.map((item) => { const p = products.find((x) => x.id === item.productId); if (!p)
        return ""; return `<article class="cart-item"><img src="${escapeHtml(optimizeImageUrl(p.image, 180))}" alt="" width="72" height="72"><div class="cart-item-info"><strong>${escapeHtml(p.name)}</strong><span>${formatPrice(p.price)}</span><div class="quantity-control" aria-label="Số lượng ${escapeHtml(p.name)}"><button type="button" data-decrease="${escapeHtml(p.id)}">−</button><span>${item.quantity}</span><button type="button" data-increase="${escapeHtml(p.id)}">+</button></div></div><button class="remove-item" type="button" data-remove="${escapeHtml(p.id)}" aria-label="Xóa">×</button></article>`; }).join("");
    setText("cart-total", formatPrice(cart.total(products)));
};
const showToast = (message) => { window.clearTimeout(toastTimer); toast.textContent = message; toast.hidden = false; requestAnimationFrame(() => toast.classList.add("is-visible")); toastTimer = window.setTimeout(() => { toast.classList.remove("is-visible"); window.setTimeout(() => toast.hidden = true, 200); }, 2600); };
const openOverlay = (overlay) => { overlay.hidden = false; document.body.classList.add("dialog-open"); };
const closeOverlay = (overlay) => { overlay.hidden = true; if (cartDialog.hidden && productDialog.hidden)
    document.body.classList.remove("dialog-open"); };
const openCart = () => { renderCart(); openOverlay(cartDialog); getElement("close-cart").focus(); };
const openProduct = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (!p)
        return;
    activeDetailProductId = p.id;
    const images = [...(p.images?.length ? p.images : [p.image])].filter(Boolean);
    const main = getElement("detail-image");
    main.src = optimizeImageUrl(images[0] || p.image, 1200);
    main.alt = p.name;
    setText("detail-category", `${p.category} · ${p.id}`);
    setText("detail-name", p.name);
    setText("detail-description", p.description);
    setText("detail-price", formatPrice(p.price));
    const old = getElement("detail-original-price");
    old.textContent = p.originalPrice ? formatPrice(p.originalPrice) : "";
    old.hidden = !p.originalPrice;
    getElement("detail-tags").innerHTML = p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("");
    const soldOut = p.status === "out-of-stock" || p.stock === 0;
    setText("detail-stock", soldOut ? "Sản phẩm đang tạm hết hàng" : typeof p.stock === "number" ? `Còn ${p.stock} sản phẩm` : "Liên hệ shop để kiểm tra tồn kho");
    const add = getElement("detail-add-cart");
    add.disabled = soldOut;
    add.textContent = soldOut ? "Tạm hết hàng" : "＋ Thêm vào giỏ";
    getElement("detail-thumbnails").innerHTML = images.map((url, i) => `<button type="button" class="${i === 0 ? "is-active" : ""}" data-detail-image="${escapeHtml(optimizeImageUrl(url, 1200))}"><img src="${escapeHtml(optimizeImageUrl(url, 180))}" alt="Ảnh ${i + 1}"></button>`).join("");
    openOverlay(productDialog);
};
const createOrderText = () => { const now = new Date(); const code = `DH${now.toISOString().slice(0, 10).replace(/-/g, "")}-${String(now.getTime()).slice(-4)}`; const lines = cart.getItems().flatMap((item, index) => { const p = products.find((x) => x.id === item.productId); return p ? [`${index + 1}. ${p.name} (${p.id})`, `   ${item.quantity} × ${formatPrice(p.price)}`] : []; }); return [`Xin chào ${settings.shopName}, tôi muốn đặt đơn ${code}:`, "", ...lines, "", `Tổng tạm tính: ${formatPrice(cart.total(products))}`, "Vui lòng xác nhận giúp tôi. Cảm ơn shop!"].join("\n"); };
const copyText = async (text) => { try {
    await navigator.clipboard.writeText(text);
}
catch {
    const a = document.createElement("textarea");
    a.value = text;
    a.style.position = "fixed";
    a.style.opacity = "0";
    document.body.append(a);
    a.select();
    document.execCommand("copy");
    a.remove();
} };
const copyOrder = async (openChannel) => { if (!cart.count())
    return; await copyText(createOrderText()); const channel = getSalesChannel(); if (openChannel) {
    showToast(`Đã copy đơn. Hãy dán nội dung vào ${channel.label}.`);
    window.open(channel.url, "_blank", "noopener,noreferrer");
}
else
    showToast("Đã copy nội dung đơn hàng."); };
document.addEventListener("click", (event) => {
    const target = event.target;
    const add = target.closest("[data-add-to-cart]");
    const category = target.closest("[data-category]");
    const page = target.closest("[data-page]");
    const view = target.closest("[data-view-product]");
    const decrease = target.closest("[data-decrease]");
    const increase = target.closest("[data-increase]");
    const remove = target.closest("[data-remove]");
    const thumb = target.closest("[data-detail-image]");
    if (add?.dataset.addToCart) {
        cart.add(add.dataset.addToCart);
        renderCart();
        showToast("Đã thêm sản phẩm vào giỏ.");
    }
    if (category?.dataset.category) {
        selectedCategory = category.dataset.category;
        currentPage = 1;
        renderCategories();
        renderProducts();
        getElement("catalog-title").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (page?.dataset.page && !page.disabled) {
        currentPage = Number(page.dataset.page);
        renderProducts();
        getElement("catalog-title").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (view?.dataset.viewProduct && !add)
        openProduct(view.dataset.viewProduct);
    if (decrease?.dataset.decrease) {
        const item = cart.getItems().find((x) => x.productId === decrease.dataset.decrease);
        if (item)
            cart.updateQuantity(item.productId, item.quantity - 1);
        renderCart();
    }
    if (increase?.dataset.increase) {
        const item = cart.getItems().find((x) => x.productId === increase.dataset.increase);
        if (item)
            cart.updateQuantity(item.productId, item.quantity + 1);
        renderCart();
    }
    if (remove?.dataset.remove) {
        cart.remove(remove.dataset.remove);
        renderCart();
    }
    if (thumb?.dataset.detailImage) {
        getElement("detail-image").src = thumb.dataset.detailImage;
        getElement("detail-thumbnails").querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === thumb));
    }
});
productList.addEventListener("keydown", (event) => { const target = event.target; if ((event.key === "Enter" || event.key === " ") && target.dataset.viewProduct) {
    event.preventDefault();
    openProduct(target.dataset.viewProduct);
} });
getElement("search-input").addEventListener("input", (e) => { query = e.target.value; currentPage = 1; renderProducts(); });
getElement("price-filter").addEventListener("change", (e) => { selectedPriceFilterId = e.target.value; currentPage = 1; renderProducts(); });
getElement("sort-select").addEventListener("change", (e) => { sortOption = e.target.value; currentPage = 1; renderProducts(); });
getElement("cart-button").addEventListener("click", openCart);
getElement("close-cart").addEventListener("click", () => closeOverlay(cartDialog));
getElement("continue-shopping").addEventListener("click", () => closeOverlay(cartDialog));
getElement("close-product").addEventListener("click", () => closeOverlay(productDialog));
getElement("detail-add-cart").addEventListener("click", () => { if (activeDetailProductId) {
    cart.add(activeDetailProductId);
    renderCart();
    showToast("Đã thêm sản phẩm vào giỏ.");
} });
getElement("copy-order").addEventListener("click", () => void copyOrder(false));
getElement("channel-order").addEventListener("click", () => void copyOrder(true));
getElement("reset-filter").addEventListener("click", () => { selectedCategory = "Tất cả"; selectedPriceFilterId = "all"; query = ""; currentPage = 1; getElement("search-input").value = ""; getElement("price-filter").value = "all"; renderCategories(); renderProducts(); });
getElement("filter-toggle").addEventListener("click", () => { const f = getElement("filters"); const open = f.classList.toggle("is-open"); getElement("filter-toggle").setAttribute("aria-expanded", String(open)); });
[cartDialog, productDialog].forEach((overlay) => overlay.addEventListener("click", (e) => { if (e.target === overlay)
    closeOverlay(overlay); }));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") {
    if (!productDialog.hidden)
        closeOverlay(productDialog);
    else if (!cartDialog.hidden)
        closeOverlay(cartDialog);
} });
const initialize = async () => { applyShopInformation(); renderPriceFilters(); renderCategories(); renderProducts(); renderCart(); try {
    const catalog = await loadRemoteCatalog();
    if (!catalog)
        return;
    products = Array.isArray(catalog.products) ? catalog.products : [];
    settings = { ...settings, ...catalog.settings };
    priceFilters = Array.isArray(catalog.priceFilters) ? catalog.priceFilters : [];
    applyShopInformation();
    renderPriceFilters();
    renderCategories();
    renderProducts();
    renderCart();
}
catch (error) {
    catalogStatus.textContent = "Chưa tải được dữ liệu mới. Website đang hiển thị dữ liệu dự phòng.";
    catalogStatus.hidden = false;
    console.error(error);
} };
void initialize();
