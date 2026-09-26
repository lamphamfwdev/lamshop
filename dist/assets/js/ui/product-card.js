import { escapeHtml, formatPrice, optimizeImageUrl } from "../utils/format.js";
export const renderProductCard = (product) => {
    const discount = product.originalPrice
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;
    const soldOut = product.status === "out-of-stock" || product.stock === 0;
    return `
    <article class="product-card">
      <div class="product-image-wrap" data-view-product="${escapeHtml(product.id)}" role="button" tabindex="0" aria-label="Xem ${escapeHtml(product.name)}">
        ${product.featured ? '<span class="featured-badge">Nổi bật</span>' : ""}
        ${soldOut ? '<span class="stock-badge">Hết hàng</span>' : ""}
        <img
          class="product-image"
          src="${escapeHtml(optimizeImageUrl(product.image, 720))}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          width="640"
          height="480"
        />
      </div>
      <div class="product-content">
        <div class="product-meta">
          <span>${escapeHtml(product.category)}</span>
          <span>${escapeHtml(product.id)}</span>
        </div>
        <h3><button type="button" data-view-product="${escapeHtml(product.id)}">${escapeHtml(product.name)}</button></h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="tag-list">
          ${product.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="price-block">
          <div>
            <strong>${formatPrice(product.price)}</strong>
            ${product.originalPrice ? `<del>${formatPrice(product.originalPrice)}</del>` : ""}
          </div>
          ${discount ? `<span class="discount">-${discount}%</span>` : ""}
        </div>
        <button class="add-to-cart" type="button" data-add-to-cart="${escapeHtml(product.id)}" ${soldOut ? "disabled" : ""}>
          <span aria-hidden="true">＋</span> ${soldOut ? "Tạm hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </article>
  `;
};
