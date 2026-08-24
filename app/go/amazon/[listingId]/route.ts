import { env } from "cloudflare:workers";

export async function GET(request: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const listing = await env.DB.prepare(`
    SELECT ml.id, ml.product_id AS productId, ml.affiliate_url AS affiliateUrl
    FROM merchant_listings ml
    JOIN products p ON p.id = ml.product_id
    WHERE ml.id = ? AND ml.merchant = 'amazon' AND ml.status = 'active' AND p.status = 'published'
  `).bind(listingId).first<{ id: string; productId: string; affiliateUrl: string }>();

  if (!listing) return new Response("Offer not found", { status: 404 });
  const referrerHost = safeReferrerHost(request.headers.get("referer"));
  await env.DB.prepare("INSERT INTO outbound_clicks (listing_id, product_id, merchant, referrer_host, clicked_at) VALUES (?, ?, 'amazon', ?, ?)")
    .bind(listing.id, listing.productId, referrerHost, new Date().toISOString()).run();

  return Response.redirect(listing.affiliateUrl, 302);
}

function safeReferrerHost(value: string | null): string | null {
  if (!value) return null;
  try { return new URL(value).hostname.slice(0, 255); } catch { return null; }
}
