import type { Product } from "../models/product.js";
import { escapeHtml, formatPrice } from "../utils/format.js";

export const renderProductCard = (product: Product): string => {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        ${product.featured ? '<span class="featured-badge">Nổi bật</span>' : ""}
        <img
          class="product-image"
          src="${escapeHtml(product.image)}"
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
        <h3>${escapeHtml(product.name)}</h3>
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
        <button class="add-to-cart" type="button" data-add-to-cart="${escapeHtml(product.id)}">
          <span aria-hidden="true">＋</span> Thêm vào giỏ
        </button>
      </div>
    </article>
  `;
};
