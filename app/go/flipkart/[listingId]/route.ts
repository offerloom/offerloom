import { env } from "cloudflare:workers";

/** Accept only canonical Flipkart product pages: https://www.flipkart.com/<slug>/p/<itm id>. */
export function isFlipkartProductUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.flipkart.com" && !url.port && !url.username && !url.search && !url.hash
      && /^\/[a-z0-9-]+\/p\/itm[a-z0-9]{10,20}$/.test(url.pathname);
  } catch { return false; }
}

export async function GET(request: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const listing = await env.DB.prepare(`
    SELECT ml.id, ml.product_id AS productId, ml.affiliate_url AS affiliateUrl
    FROM merchant_listings ml JOIN products p ON p.id = ml.product_id
    JOIN merchants m ON m.id = ml.merchant
    WHERE ml.id = ? AND ml.merchant = 'flipkart' AND ml.status = 'active'
      AND m.status = 'active' AND p.status = 'published'
  `).bind(listingId).first<{ id: string; productId: string; affiliateUrl: string }>();
  if (!listing || !isFlipkartProductUrl(listing.affiliateUrl)) return new Response("Offer not found", { status: 404 });
  let referrerHost: string | null = null;
  try { referrerHost = new URL(request.headers.get("referer") ?? "").hostname.slice(0, 255); } catch { /* No valid referrer. */ }
  await env.DB.prepare("INSERT INTO outbound_clicks (listing_id, product_id, merchant, referrer_host, clicked_at) VALUES (?, ?, 'flipkart', ?, ?)")
    .bind(listing.id, listing.productId, referrerHost, new Date().toISOString()).run();
  return new Response(null, { status: 302, headers: { Location: listing.affiliateUrl, "Cache-Control": "no-store" } });
}
