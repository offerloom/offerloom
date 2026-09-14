import { normalizeAmazonProductUrl } from "./amazon";

export type CollectedDeal = { sourceUrl: string; merchant: string; merchantProductId: string; name: string; category: string; imageUrl: string; price: number; mrp: number | null; checkedAt: string; currency: "INR" };

export function validateCollectedDeal(value: unknown): CollectedDeal {
  if (!value || typeof value !== "object") throw new Error("Invalid product");
  const d = value as Record<string, unknown>;
  const url = new URL(String(d.sourceUrl));
  if (url.username || url.password || url.port || url.protocol !== "https:") throw new Error("Invalid source URL");
  let merchant: string, merchantProductId: string, sourceUrl: string;
  if (["amazon.in", "www.amazon.in"].includes(url.hostname)) {
    const amazon = normalizeAmazonProductUrl(url.href);
    merchant = "amazon"; merchantProductId = amazon.asin; sourceUrl = amazon.sourceUrl;
  } else {
    const id = url.pathname.match(/\/p\/(\d+_[a-z0-9]+)\/?$/i)?.[1];
    if (url.protocol !== "https:" || url.hostname !== "www.ajio.com" || !id || url.username || url.password || url.port) throw new Error("Unsupported source");
    merchant = "ajio"; merchantProductId = id; sourceUrl = url.origin + url.pathname;
  }
  const image = new URL(String(d.imageUrl));
  const allowedImages = merchant === "amazon" ? ["m.media-amazon.com", "images-na.ssl-images-amazon.com", "images-eu.ssl-images-amazon.com"] : ["assets.ajio.com", "assets-jiocdn.ajio.com"];
  if (image.protocol !== "https:" || !allowedImages.includes(image.hostname) || image.username || image.password || image.port) throw new Error("Unsupported image host");
  const price = Number(d.price), mrp = d.mrp == null ? null : Number(d.mrp);
  if (!Number.isSafeInteger(price) || price <= 0 || price >= 100000000 || (mrp !== null && (!Number.isSafeInteger(mrp) || mrp < price || mrp >= 100000000))) throw new Error("Invalid price in paise");
  const checked = Date.parse(String(d.checkedAt));
  if (!Number.isFinite(checked) || checked > Date.now() + 60000 || checked < Date.now() - 86400000) throw new Error("Observation must be less than 24 hours old");
  const name = String(d.name ?? "").trim(), category = String(d.category ?? "").trim();
  if (name.length < 3 || name.length > 300 || category.length < 2 || category.length > 80 || d.currency !== "INR") throw new Error("Invalid product details");
  return { sourceUrl, merchant, merchantProductId, name, category, imageUrl: image.href, price, mrp, checkedAt: new Date(checked).toISOString(), currency: "INR" };
}
