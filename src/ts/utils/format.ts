export const formatPrice = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);

export const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[
        character
      ] ?? character
  );

export const optimizeImageUrl = (value: string, width = 800): string => {
  if (!value.includes("res.cloudinary.com/") || !value.includes("/upload/")) return value;
  return value.replace("/upload/", `/upload/f_auto,q_auto,w_${Math.max(120, Math.round(width))},c_limit/`);
};
