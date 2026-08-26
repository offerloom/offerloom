const AMAZON_HOSTS = new Set(["amazon.in", "www.amazon.in"]);
export const AMAZON_ASSOCIATE_TAG = "offerloom-21";
const ASIN_PATTERN = /^[A-Z0-9]{10}$/i;

export type AmazonDestination = {
  asin: string;
  sourceUrl: string;
  affiliateUrl: string;
};

export function isAmazonAsin(value: string): boolean {
  return ASIN_PATTERN.test(value.trim());
}

/** Pull an ASIN from a raw ASIN or any Amazon.in product URL. */
export function parseAmazonAsin(value: string): string | null {
  const input = value.trim();
  if (ASIN_PATTERN.test(input)) return input.toUpperCase();

  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || !AMAZON_HOSTS.has(url.hostname.toLowerCase())) return null;
    const match = url.pathname.match(/\/(?:dp|gp\/aw\/d)\/([A-Z0-9]{10})(?:\/|$)/i);
    return match ? match[1].toUpperCase() : null;
  } catch {
    return null;
  }
}

/** Canonical tagged product URL — equivalent to SiteStripe “Full Link” with offerloom-21. */
export function buildAmazonProductUrl(asin: string): string {
  const normalized = parseAmazonAsin(asin);
  if (!normalized) throw new Error("Enter a valid Amazon.in product URL or ASIN.");
  return withAmazonAssociateTag(`https://www.amazon.in/dp/${normalized}`);
}

/** Tagged Amazon search URL for category browsing. */
export function buildAmazonSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Enter a search query.");
  return withAmazonAssociateTag(`https://www.amazon.in/s?k=${encodeURIComponent(trimmed)}`);
}

export function offerloomAmazonProductPath(asin: string): string {
  const normalized = parseAmazonAsin(asin);
  if (!normalized) throw new Error("Enter a valid Amazon.in product URL or ASIN.");
  return `/go/amazon/dp/${normalized}`;
}

export function offerloomAmazonSearchPath(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Enter a search query.");
  return `/go/amazon/search?k=${encodeURIComponent(trimmed)}`;
}

/** Ensure every outbound Amazon.in URL carries the OfferLoom Associates tag. */
export function withAmazonAssociateTag(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return value;
  }

  if (url.protocol !== "https:" || !AMAZON_HOSTS.has(url.hostname.toLowerCase())) {
    return value;
  }

  url.searchParams.set("tag", AMAZON_ASSOCIATE_TAG);
  return url.toString();
}

export function normalizeAmazonProductUrl(value: string): AmazonDestination {
  const input = value.trim();
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a complete Amazon.in product URL.");
  }

  if (url.protocol !== "https:" || !AMAZON_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Only HTTPS product links from Amazon.in are accepted.");
  }

  const asin = parseAmazonAsin(input);
  if (!asin) throw new Error("The Amazon URL does not contain a valid ASIN.");

  const sourceUrl = `https://www.amazon.in/dp/${asin}`;
  return { asin, sourceUrl, affiliateUrl: buildAmazonProductUrl(asin) };
}

export function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
