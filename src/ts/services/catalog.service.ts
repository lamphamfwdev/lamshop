import { RUNTIME_CONFIG } from "../config/runtime.config.js";
import type { CatalogPayload } from "../models/product.js";

const isConfigured = (): boolean =>
  RUNTIME_CONFIG.catalogApiUrl.startsWith("https://script.google.com/macros/s/");

export const loadRemoteCatalog = (): Promise<CatalogPayload | null> => {
  if (!isConfigured()) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const callbackName = `lamShopCatalog_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(new Error("Quá thời gian tải dữ liệu")), RUNTIME_CONFIG.requestTimeoutMs);

    const finish = (error?: Error, payload?: CatalogPayload): void => {
      window.clearTimeout(timeout);
      script.remove();
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (error) reject(error);
      else resolve(payload ?? null);
    };

    (window as unknown as Record<string, unknown>)[callbackName] = (payload: CatalogPayload): void => {
      finish(undefined, payload);
    };

    script.onerror = () => finish(new Error("Không tải được dữ liệu từ Google Sheets"));
    const separator = RUNTIME_CONFIG.catalogApiUrl.includes("?") ? "&" : "?";
    script.src = `${RUNTIME_CONFIG.catalogApiUrl}${separator}action=catalog&callback=${callbackName}&_=${Date.now()}`;
    document.head.append(script);
  });
};
