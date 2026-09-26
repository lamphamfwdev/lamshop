const PUBLIC_SHEETS = {
  products: "Products",
  settings: "Settings",
  priceFilters: "PriceFilters"
};

function doGet(e) {
  try {
    const payload = getCatalogPayload_();
    return createResponse_(payload, e && e.parameter ? e.parameter.callback : "");
  } catch (error) {
    return createResponse_({
      error: true,
      message: error && error.message ? error.message : "Không thể đọc dữ liệu cửa hàng"
    }, e && e.parameter ? e.parameter.callback : "");
  }
}

function getCatalogPayload_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("catalog-v1");
  if (cached) return JSON.parse(cached);

  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Chưa cấu hình SPREADSHEET_ID trong Script Properties");

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const productRows = sheetObjects_(spreadsheet.getSheetByName(PUBLIC_SHEETS.products));
  const settingRows = sheetObjects_(spreadsheet.getSheetByName(PUBLIC_SHEETS.settings));
  const filterRows = sheetObjects_(spreadsheet.getSheetByName(PUBLIC_SHEETS.priceFilters));

  const products = productRows
    .filter(function (row) {
      const status = String(row.status || "active").trim().toLowerCase();
      return asBoolean_(row.active) && !asBoolean_(row.archived) && status !== "draft";
    })
    .map(function (row) {
      return {
        id: String(row.id || "").trim(),
        name: String(row.name || "").trim(),
        description: String(row.description || "").trim(),
        category: String(row.category || "Khác").trim(),
        price: asNumber_(row.price, 0),
        originalPrice: nullableNumber_(row.originalPrice),
        image: String(row.imageUrl || "").trim(),
        images: [row.imageUrl, row.imageUrl2, row.imageUrl3, row.imageUrl4, row.imageUrl5]
          .map(function (url) { return String(url || "").trim(); }).filter(Boolean),
        tags: String(row.tags || "").split("|").map(function (tag) { return tag.trim(); }).filter(Boolean),
        featured: asBoolean_(row.featured),
        stock: nullableNumber_(row.stock),
        status: String(row.status || "active").trim().toLowerCase()
      };
    })
    .filter(function (product) { return product.id && product.name && product.price >= 0; });

  const settings = {};
  settingRows.forEach(function (row) {
    const key = String(row.key || "").trim();
    if (!key) return;
    settings[key] = key === "productsPerPage" ? asNumber_(row.value, 24) : String(row.value || "");
  });

  const priceFilters = filterRows
    .filter(function (row) { return asBoolean_(row.active); })
    .map(function (row) {
      return {
        id: String(row.id || "").trim(),
        label: String(row.label || "").trim(),
        minPrice: nullableNumber_(row.minPrice),
        maxPrice: nullableNumber_(row.maxPrice),
        sortOrder: asNumber_(row.sortOrder, 0)
      };
    })
    .filter(function (filter) { return filter.id && filter.label; })
    .sort(function (a, b) { return a.sortOrder - b.sortOrder; });

  const payload = {
    products: products,
    settings: settings,
    priceFilters: priceFilters,
    updatedAt: new Date().toISOString()
  };

  cache.put("catalog-v1", JSON.stringify(payload), 30);
  return payload;
}

function sheetObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(function (header) { return String(header).trim(); });
  return values.map(function (row) {
    const result = {};
    headers.forEach(function (header, index) { result[header] = row[index]; });
    return result;
  });
}

function asNumber_(value, fallback) {
  if (value === "" || value === null || typeof value === "undefined") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nullableNumber_(value) {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asBoolean_(value) {
  if (value === true || value === 1) return true;
  return ["true", "1", "yes", "có", "x"].indexOf(String(value).trim().toLowerCase()) >= 0;
}

function createResponse_(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
