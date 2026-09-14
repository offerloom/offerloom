import { env } from "cloudflare:workers";
import { isApprovedAjioLink } from "../../../lib/ajio";

export async function GET(request: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const listing = await env.DB.prepare(`
    SELECT ml.id, ml.product_id AS productId, ml.affiliate_url AS affiliateUrl
    FROM merchant_listings ml JOIN products p ON p.id = ml.product_id
    JOIN merchants m ON m.id = ml.merchant
    WHERE ml.id = ? AND ml.merchant = 'ajio' AND ml.status = 'active'
      AND m.status = 'active' AND p.status = 'published'
  `).bind(listingId).first<{ id: string; productId: string; affiliateUrl: string }>();
  if (!listing || !isApprovedAjioLink(listing.affiliateUrl)) return new Response("Offer not found", { status: 404 });
  let referrerHost: string | null = null;
  try { referrerHost = new URL(request.headers.get("referer") ?? "").hostname.slice(0, 255); } catch { /* No valid referrer. */ }
  await env.DB.prepare("INSERT INTO outbound_clicks (listing_id, product_id, merchant, referrer_host, clicked_at) VALUES (?, ?, 'ajio', ?, ?)")
    .bind(listing.id, listing.productId, referrerHost, new Date().toISOString()).run();
  return new Response(null, { status: 302, headers: { Location: listing.affiliateUrl, "Cache-Control": "no-store" } });
}
