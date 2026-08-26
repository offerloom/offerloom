import { env } from "cloudflare:workers";
import { buildAmazonProductUrl, isAmazonAsin } from "../../../../lib/amazon";

export async function GET(request: Request, context: { params: Promise<{ asin: string }> }) {
  const { asin } = await context.params;
  const normalized = asin.trim().toUpperCase();
  if (!isAmazonAsin(normalized)) return new Response("Invalid ASIN", { status: 400 });

  const listing = await env.DB.prepare(`
    SELECT ml.id, ml.product_id AS productId
    FROM merchant_listings ml
    JOIN products p ON p.id = ml.product_id
    JOIN merchants m ON m.id = ml.merchant
    WHERE ml.merchant = 'amazon' AND ml.merchant_product_id = ? AND ml.status = 'active'
      AND m.status = 'active' AND p.status = 'published'
    LIMIT 1
  `).bind(normalized).first<{ id: string; productId: string }>();

  if (listing) {
    const referrerHost = safeReferrerHost(request.headers.get("referer"));
    await env.DB.prepare("INSERT INTO outbound_clicks (listing_id, product_id, merchant, referrer_host, clicked_at) VALUES (?, ?, 'amazon', ?, ?)")
      .bind(listing.id, listing.productId, referrerHost, new Date().toISOString()).run();
  }

  return Response.redirect(buildAmazonProductUrl(normalized), 302);
}

function safeReferrerHost(value: string | null): string | null {
  if (!value) return null;
  try { return new URL(value).hostname.slice(0, 255); } catch { return null; }
}
