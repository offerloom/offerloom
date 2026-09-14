import { SITE } from "../site";

export const DEAL_HASHTAGS = [
  "#OfferLoom",
  "#DailyDeals",
  "#IndiaDeals",
  "#AmazonDeals",
  "#DealAlert",
  "#SmartShopping",
  "#SaveMoney",
  "#ShoppingDeals",
  "#BestDeals",
  "#FlashSale",
] as const;

export function pickHashtags(count = 8) {
  return DEAL_HASHTAGS.slice(0, count).join(" ");
}

export function buildHashtagLine(extra: string[] = []) {
  const tags = new Set([...DEAL_HASHTAGS.slice(0, 6), ...extra.map((tag) => tag.startsWith("#") ? tag : `#${tag}`)]);
  return [...tags].join(" ");
}

export function defaultThumbnailPath() {
  return "/brand/logo-square-1080.png";
}

export function absolutePublicUrl(pathOrUrl: string, origin = SITE.publicUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`, origin).toString();
}
