import { readSheet } from "read-excel-file/node";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const excelPath = path.join(projectRoot, "data", "products.xlsx");
const outputPath = path.join(projectRoot, "src", "ts", "data", "products.generated.ts");
const sheetName = "San pham";

const expectedHeaders = [
  "Mã sản phẩm",
  "Tên sản phẩm",
  "Mô tả",
  "Danh mục",
  "Giá bán",
  "Giá gốc",
  "Ảnh",
  "Thẻ",
  "Nổi bật",
  "Hiển thị"
];

const rows = await readSheet(excelPath, sheetName);

if (rows.length === 0) throw new Error(`Sheet "${sheetName}" đang trống`);

const headers = new Map();
rows[0].forEach((value, columnIndex) => {
  headers.set(String(value ?? "").trim(), columnIndex);
});

const missingHeaders = expectedHeaders.filter((header) => !headers.has(header));
if (missingHeaders.length > 0) {
  throw new Error(`Excel thiếu cột: ${missingHeaders.join(", ")}`);
}

const cellValue = (row, header) => row[headers.get(header)];
const cellText = (row, header) => String(cellValue(row, header) ?? "").trim();

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return defaultValue;
  return ["true", "1", "yes", "y", "x", "có", "co"].includes(normalized);
};

const parseMoney = (value, required, rowNumber, header) => {
  if (value === null || value === undefined || value === "") {
    if (required) throw new Error(`Dòng ${rowNumber}: ${header} đang trống`);
    return undefined;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[\s.,₫đ]/gi, ""));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Dòng ${rowNumber}: ${header} phải là số không âm`);
  }

  return Math.round(parsed);
};

const normalizeImagePath = (value) => {
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("./") || value.startsWith("/")) {
    return value;
  }
  return `./assets/images/products/${value}`;
};

const products = [];
const errors = [];
const ids = new Set();

for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
  const rowNumber = rowIndex + 1;
  const row = rows[rowIndex];
  const hasData = expectedHeaders.some((header) => cellText(row, header) !== "");
  if (!hasData) continue;
  if (!parseBoolean(cellValue(row, "Hiển thị"), true)) continue;

  try {
    const id = cellText(row, "Mã sản phẩm");
    const name = cellText(row, "Tên sản phẩm");
    const description = cellText(row, "Mô tả");
    const category = cellText(row, "Danh mục");
    const image = cellText(row, "Ảnh");
    const price = parseMoney(cellValue(row, "Giá bán"), true, rowNumber, "Giá bán");
    const originalPrice = parseMoney(cellValue(row, "Giá gốc"), false, rowNumber, "Giá gốc");

    if (!id) throw new Error(`Dòng ${rowNumber}: Mã sản phẩm đang trống`);
    if (ids.has(id)) throw new Error(`Dòng ${rowNumber}: Mã sản phẩm ${id} bị trùng`);
    if (!name) throw new Error(`Dòng ${rowNumber}: Tên sản phẩm đang trống`);
    if (!description) throw new Error(`Dòng ${rowNumber}: Mô tả đang trống`);
    if (!category) throw new Error(`Dòng ${rowNumber}: Danh mục đang trống`);
    if (!image) throw new Error(`Dòng ${rowNumber}: Ảnh đang trống`);
    if (originalPrice !== undefined && originalPrice < price) {
      throw new Error(`Dòng ${rowNumber}: Giá gốc phải lớn hơn hoặc bằng giá bán`);
    }

    ids.add(id);
    products.push({
      id,
      name,
      description,
      category,
      price,
      ...(originalPrice === undefined ? {} : { originalPrice }),
      image: normalizeImagePath(image),
      tags: cellText(row, "Thẻ")
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean),
      featured: parseBoolean(cellValue(row, "Nổi bật"))
    });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
}

if (errors.length > 0) {
  throw new Error(`Không thể tạo dữ liệu sản phẩm:\n- ${errors.join("\n- ")}`);
}

if (products.length === 0) {
  throw new Error("Excel không có sản phẩm nào đang được hiển thị");
}

const generatedSource = `// FILE TỰ ĐỘNG TẠO TỪ data/products.xlsx — KHÔNG SỬA TRỰC TIẾP.\n` +
  `import type { Product } from "../models/product.js";\n\n` +
  `export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};\n`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, generatedSource, "utf8");
console.log(`Đã tạo ${products.length} sản phẩm từ data/products.xlsx`);
