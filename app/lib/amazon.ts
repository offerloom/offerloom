const AMAZON_HOSTS = new Set(["amazon.in", "www.amazon.in"]);
export const AMAZON_ASSOCIATE_TAG = "offerloom-21";

export type AmazonDestination = {
  asin: string;
  sourceUrl: string;
  affiliateUrl: string;
};

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

  const match = url.pathname.match(/\/(?:dp|gp\/aw\/d)\/([A-Z0-9]{10})(?:\/|$)/i);
  if (!match) throw new Error("The Amazon URL does not contain a valid ASIN.");

  const asin = match[1].toUpperCase();
  const sourceUrl = `https://www.amazon.in/dp/${asin}`;
  return { asin, sourceUrl, affiliateUrl: withAmazonAssociateTag(sourceUrl) };
}

export function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
