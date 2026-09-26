const ADMIN_SHEETS = {
  products: "Products",
  settings: "Settings",
  priceFilters: "PriceFilters"
};

const PRODUCT_HEADERS = [
  "id", "name", "description", "category", "price", "originalPrice",
  "imageUrl", "tags", "featured", "active", "createdAt", "updatedAt",
  "imageUrl2", "imageUrl3", "imageUrl4", "imageUrl5", "stock", "status", "archived"
];
const SETTING_HEADERS = ["key", "value", "updatedAt"];
const FILTER_HEADERS = ["id", "label", "minPrice", "maxPrice", "sortOrder", "active", "updatedAt"];

const SETTING_KEYS = [
  "shopName", "logoUrl", "tagline", "pageTitle", "metaDescription",
  "heroEyebrow", "heroTitle", "heroDescription", "heroBadgeTitle", "heroBadgeContent",
  "heroImageUrl",
  "footerDescription", "address", "phone", "email", "facebookPageName",
  "facebookPageUsername", "defaultSalesChannel", "facebookUrl", "instagramUrl",
  "zaloPersonalUrl", "zaloOaUrl", "tiktokUrl", "productsPerPage"
];

function doGet() {
  assertAdmin_();
  return HtmlService.createTemplateFromFile("Admin")
    .evaluate()
    .setTitle("Quản trị LAM SHOP")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function setupDatabase() {
  assertAdmin_();
  const spreadsheet = getSpreadsheet_();
  ensureSheet_(spreadsheet, ADMIN_SHEETS.products, PRODUCT_HEADERS);
  ensureSheet_(spreadsheet, ADMIN_SHEETS.settings, SETTING_HEADERS);
  ensureSheet_(spreadsheet, ADMIN_SHEETS.priceFilters, FILTER_HEADERS);
  seedSettings_(spreadsheet);
  seedPriceFilters_(spreadsheet);
  return getAdminData();
}

function getAdminData() {
  assertAdmin_();
  const spreadsheet = getSpreadsheet_();
  const productsSheet = ensureSheet_(spreadsheet, ADMIN_SHEETS.products, PRODUCT_HEADERS);
  const settingsSheet = ensureSheet_(spreadsheet, ADMIN_SHEETS.settings, SETTING_HEADERS);
  const filtersSheet = ensureSheet_(spreadsheet, ADMIN_SHEETS.priceFilters, FILTER_HEADERS);
  seedSettings_(spreadsheet);
  seedPriceFilters_(spreadsheet);

  const products = sheetObjects_(productsSheet).map(normalizeProduct_)
    .filter(function (product) { return !product.archived; });
  const settings = {};
  sheetObjects_(settingsSheet).forEach(function (row) {
    if (row.key) settings[String(row.key)] = row.value;
  });
  const priceFilters = sheetObjects_(filtersSheet)
    .map(normalizePriceFilter_)
    .sort(function (a, b) { return a.sortOrder - b.sortOrder; });

  return {
    products: products,
    settings: settings,
    priceFilters: priceFilters,
    spreadsheetUrl: spreadsheet.getUrl(),
    userEmail: Session.getActiveUser().getEmail() || "Tài khoản quản trị"
  };
}

function saveProduct(input) {
  assertAdmin_();
  const product = sanitizeProduct_(input || {});
  if (!product.id) throw new Error("Mã sản phẩm không được để trống");
  if (!product.name) throw new Error("Tên sản phẩm không được để trống");
  if (!product.category) throw new Error("Danh mục không được để trống");
  if (!Number.isFinite(product.price) || product.price < 0) throw new Error("Giá bán không hợp lệ");
  if (!product.imageUrl) throw new Error("Hãy tải lên hoặc nhập ảnh sản phẩm");

  const sheet = ensureSheet_(getSpreadsheet_(), ADMIN_SHEETS.products, PRODUCT_HEADERS);
  const rowIndex = findRowByValue_(sheet, 1, product.id);
  const now = new Date();
  const createdAt = rowIndex > 0 ? sheet.getRange(rowIndex, PRODUCT_HEADERS.indexOf("createdAt") + 1).getValue() : now;
  const row = PRODUCT_HEADERS.map(function (header) {
    if (header === "createdAt") return createdAt;
    if (header === "updatedAt") return now;
    return product[header];
  });

  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return getAdminData();
}

function deleteProduct(productId) {
  assertAdmin_();
  const sheet = ensureSheet_(getSpreadsheet_(), ADMIN_SHEETS.products, PRODUCT_HEADERS);
  const rowIndex = findRowByValue_(sheet, 1, String(productId || "").trim());
  if (rowIndex > 1) {
    sheet.getRange(rowIndex, PRODUCT_HEADERS.indexOf("archived") + 1).setValue(true);
    sheet.getRange(rowIndex, PRODUCT_HEADERS.indexOf("active") + 1).setValue(false);
    sheet.getRange(rowIndex, PRODUCT_HEADERS.indexOf("updatedAt") + 1).setValue(new Date());
  }
  return getAdminData();
}

function duplicateProduct(productId) {
  assertAdmin_();
  const sheet = ensureSheet_(getSpreadsheet_(), ADMIN_SHEETS.products, PRODUCT_HEADERS);
  const sourceRow = findRowByValue_(sheet, 1, String(productId || "").trim());
  if (sourceRow < 2) throw new Error("Không tìm thấy sản phẩm để nhân bản");
  const source = normalizeProduct_(sheetObjects_(sheet).filter(function (row) { return String(row.id) === String(productId); })[0] || {});
  let suffix = 1;
  let newId = source.id + "-COPY";
  while (findRowByValue_(sheet, 1, newId) > 0) { suffix += 1; newId = source.id + "-COPY-" + suffix; }
  return saveProduct(Object.assign({}, source, { id: newId, name: source.name + " (bản sao)", active: false, status: "draft", archived: false }));
}

function saveSettings(input) {
  assertAdmin_();
  const values = input || {};
  const sheet = ensureSheet_(getSpreadsheet_(), ADMIN_SHEETS.settings, SETTING_HEADERS);
  const existingRows = sheetObjects_(sheet);
  const existing = {};
  existingRows.forEach(function (row) { existing[String(row.key)] = row.value; });
  const now = new Date();

  const rows = SETTING_KEYS.map(function (key) {
    let value = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : existing[key];
    if (key === "productsPerPage") value = Math.max(1, Number(value) || 24);
    return [key, value === null || typeof value === "undefined" ? "" : value, now];
  });

  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, SETTING_HEADERS.length).clearContent();
  sheet.getRange(2, 1, rows.length, SETTING_HEADERS.length).setValues(rows);
  return getAdminData();
}

function savePriceFilter(input) {
  assertAdmin_();
  const filter = sanitizePriceFilter_(input || {});
  if (!filter.id) filter.id = "price-" + Date.now();
  if (!filter.label) throw new Error("Tên mức giá không được để trống");
  if (filter.minPrice !== "" && filter.maxPrice !== "" && filter.minPrice >= filter.maxPrice) {
    throw new Error("Giá từ phải nhỏ hơn giá đến");
  }

  const sheet = ensureSheet_(getSpreadsheet_(), ADMIN_SHEETS.priceFilters, FILTER_HEADERS);
  const rowIndex = findRowByValue_(sheet, 1, filter.id);
  const now = new Date();
  const row = FILTER_HEADERS.map(function (header) {
    if (header === "updatedAt") return now;
    return filter[header];
  });
  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return getAdminData();
}

function deletePriceFilter(filterId) {
  assertAdmin_();
  const sheet = ensureSheet_(getSpreadsheet_(), ADMIN_SHEETS.priceFilters, FILTER_HEADERS);
  const rowIndex = findRowByValue_(sheet, 1, String(filterId || "").trim());
  if (rowIndex > 1) sheet.deleteRow(rowIndex);
  return getAdminData();
}

function getCloudinaryUploadSignature(request) {
  assertAdmin_();
  const properties = PropertiesService.getScriptProperties();
  const cloudName = properties.getProperty("CLOUDINARY_CLOUD_NAME");
  const apiKey = properties.getProperty("CLOUDINARY_API_KEY");
  const apiSecret = properties.getProperty("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Chưa cấu hình Cloudinary trong Script Properties");
  }

  const type = request && request.type === "brand" ? "brand" : "products";
  const folder = "lam-shop/" + type;
  const baseName = slugify_(request && request.name ? request.name : "image");
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = baseName + "-" + timestamp;
  const signatureSource = "folder=" + folder + "&public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, signatureSource, Utilities.Charset.UTF_8);
  const signature = digest.map(function (byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return ("0" + value.toString(16)).slice(-2);
  }).join("");

  return {
    cloudName: cloudName,
    apiKey: apiKey,
    timestamp: timestamp,
    folder: folder,
    publicId: publicId,
    signature: signature
  };
}

function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Chưa cấu hình SPREADSHEET_ID trong Script Properties");
  return SpreadsheetApp.openById(spreadsheetId);
}

function assertAdmin_() {
  const allowedEmail = PropertiesService.getScriptProperties().getProperty("ADMIN_EMAIL");
  if (!allowedEmail) return;
  const activeEmail = Session.getActiveUser().getEmail();
  if (!activeEmail || activeEmail.toLowerCase() !== allowedEmail.toLowerCase()) {
    throw new Error("Tài khoản này không có quyền quản trị");
  }
}

function ensureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const existingHeaders = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0] : [];
  const needsHeaders = headers.some(function (header, index) { return existingHeaders[index] !== header; });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#205781").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function seedSettings_(spreadsheet) {
  const sheet = ensureSheet_(spreadsheet, ADMIN_SHEETS.settings, SETTING_HEADERS);
  if (sheet.getLastRow() > 1) return;
  const now = new Date();
  const defaults = {
    shopName: "LAM SHOP",
    logoUrl: "",
    tagline: "Chọn nhanh · Đặt dễ",
    pageTitle: "LAM SHOP · Sản phẩm chọn lọc",
    metaDescription: "Danh mục sản phẩm, tìm kiếm nhanh và đặt hàng qua Facebook Messenger.",
    heroEyebrow: "SẢN PHẨM NỔI BẬT",
    heroTitle: "Tìm món phù hợp với bạn",
    heroDescription: "Phụ kiện công nghệ chọn lọc, giá rõ ràng.",
    heroBadgeTitle: "Giao diện rõ ràng",
    heroBadgeContent: "Giá luôn hiển thị minh bạch",
    heroImageUrl: "",
    footerDescription: "Phụ kiện công nghệ chọn lọc, giá rõ ràng.",
    address: "TP. Hồ Chí Minh",
    phone: "0900 000 000",
    email: "hello@lamshop.vn",
    facebookPageName: "Lam Shop",
    facebookPageUsername: "YOUR_PAGE_USERNAME",
    defaultSalesChannel: "facebook",
    facebookUrl: "",
    instagramUrl: "",
    zaloPersonalUrl: "",
    zaloOaUrl: "",
    tiktokUrl: "",
    productsPerPage: 24
  };
  const rows = SETTING_KEYS.map(function (key) { return [key, defaults[key], now]; });
  sheet.getRange(2, 1, rows.length, SETTING_HEADERS.length).setValues(rows);
}

function seedPriceFilters_(spreadsheet) {
  const sheet = ensureSheet_(spreadsheet, ADMIN_SHEETS.priceFilters, FILTER_HEADERS);
  if (sheet.getLastRow() > 1) return;
  const now = new Date();
  sheet.getRange(2, 1, 4, FILTER_HEADERS.length).setValues([
    ["under-200", "Dưới 200.000đ", "", 200000, 1, true, now],
    ["200-500", "200.000đ – 500.000đ", 200000, 500000, 2, true, now],
    ["500-1000", "500.000đ – 1.000.000đ", 500000, 1000000, 3, true, now],
    ["from-1000", "Từ 1.000.000đ", 1000000, "", 4, true, now]
  ]);
}

function sheetObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(function (header) { return String(header).trim(); });
  return values.filter(function (row) { return row.some(function (cell) { return cell !== ""; }); }).map(function (row) {
    const result = {};
    headers.forEach(function (header, index) { result[header] = row[index]; });
    return result;
  });
}

function findRowByValue_(sheet, column, value) {
  if (sheet.getLastRow() < 2) return -1;
  const values = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]).trim() === String(value).trim()) return index + 2;
  }
  return -1;
}

function sanitizeProduct_(input) {
  return {
    id: String(input.id || "").trim().toUpperCase(),
    name: String(input.name || "").trim(),
    description: String(input.description || "").trim(),
    category: String(input.category || "").trim(),
    price: Number(input.price),
    originalPrice: input.originalPrice === "" || input.originalPrice === null ? "" : Number(input.originalPrice),
    imageUrl: String(input.imageUrl || "").trim(),
    imageUrl2: String(input.imageUrl2 || "").trim(),
    imageUrl3: String(input.imageUrl3 || "").trim(),
    imageUrl4: String(input.imageUrl4 || "").trim(),
    imageUrl5: String(input.imageUrl5 || "").trim(),
    tags: String(input.tags || "").split("|").map(function (tag) { return tag.trim(); }).filter(Boolean).join("|"),
    featured: Boolean(input.featured),
    active: input.active !== false,
    stock: input.stock === "" || input.stock === null || typeof input.stock === "undefined" ? "" : Math.max(0, Number(input.stock)),
    status: ["active", "out-of-stock", "draft"].indexOf(String(input.status || "active")) >= 0 ? String(input.status || "active") : "active",
    archived: Boolean(input.archived)
  };
}

function normalizeProduct_(row) {
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    description: String(row.description || ""),
    category: String(row.category || ""),
    price: Number(row.price || 0),
    originalPrice: row.originalPrice === "" ? "" : Number(row.originalPrice),
    imageUrl: String(row.imageUrl || ""),
    imageUrl2: String(row.imageUrl2 || ""),
    imageUrl3: String(row.imageUrl3 || ""),
    imageUrl4: String(row.imageUrl4 || ""),
    imageUrl5: String(row.imageUrl5 || ""),
    tags: String(row.tags || ""),
    featured: asBoolean_(row.featured),
    active: asBoolean_(row.active),
    stock: row.stock === "" ? "" : Number(row.stock),
    status: String(row.status || "active"),
    archived: asBoolean_(row.archived),
    createdAt: dateText_(row.createdAt),
    updatedAt: dateText_(row.updatedAt)
  };
}

function sanitizePriceFilter_(input) {
  return {
    id: String(input.id || "").trim(),
    label: String(input.label || "").trim(),
    minPrice: input.minPrice === "" || input.minPrice === null ? "" : Number(input.minPrice),
    maxPrice: input.maxPrice === "" || input.maxPrice === null ? "" : Number(input.maxPrice),
    sortOrder: Number(input.sortOrder || 0),
    active: input.active !== false
  };
}

function normalizePriceFilter_(row) {
  return {
    id: String(row.id || ""),
    label: String(row.label || ""),
    minPrice: row.minPrice === "" ? "" : Number(row.minPrice),
    maxPrice: row.maxPrice === "" ? "" : Number(row.maxPrice),
    sortOrder: Number(row.sortOrder || 0),
    active: asBoolean_(row.active)
  };
}

function asBoolean_(value) {
  if (value === true || value === 1) return true;
  return ["true", "1", "yes", "có", "x"].indexOf(String(value).trim().toLowerCase()) >= 0;
}

function dateText_(value) {
  if (!(value instanceof Date)) return value ? String(value) : "";
  return Utilities.formatDate(value, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
}

function slugify_(value) {
  return String(value || "image")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "image";
}
