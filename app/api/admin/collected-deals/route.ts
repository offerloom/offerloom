import { env } from "cloudflare:workers";
import { authorizeAdminApi } from "../../../lib/admin-auth";
import { validateCollectedDeal } from "../../../lib/collected-deal";
import { buildAmazonProductUrl, slugify } from "../../../lib/amazon";
import { isApprovedAjioLink } from "../../../lib/ajio";

export async function GET() {
  if (!await authorizeAdminApi()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await env.DB.prepare("SELECT id, payload, status, updated_at AS updatedAt FROM collected_deals ORDER BY updated_at DESC LIMIT 100").all();
  const runs = await env.DB.prepare("SELECT merchant_id AS merchant, status, products_seen AS seen, products_updated AS collected, error_message AS error, finished_at AS finishedAt FROM sync_runs ORDER BY id DESC LIMIT 12").all();
  return Response.json({ serverTime: Date.now(), runs: runs.results, drafts: rows.results.map((row) => ({ ...row, deal: JSON.parse(String(row.payload)), payload: undefined })) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await authorizeAdminApi()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 200000) return Response.json({ error: "Import too large" }, { status: 413 });
  try {
    const body = JSON.parse(raw);
    if (body.action === "ingest") {
      if (!Array.isArray(body.deals) || !body.deals.length || body.deals.length > 25) throw new Error("Import 1–25 observations");
      const deals = body.deals.map(validateCollectedDeal);
      await env.DB.batch(deals.map((deal: ReturnType<typeof validateCollectedDeal>) => env.DB.prepare("INSERT INTO collected_deals (id,payload,status,updated_at) VALUES (?,?,'pending',?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,status='pending',updated_at=excluded.updated_at")
        .bind(`${deal.merchant}-${deal.merchantProductId}`, JSON.stringify(deal), new Date().toISOString())));
      return Response.json({ ok: true, imported: deals.length });
    }
    if (body.action === "reject") {
      await env.DB.prepare("UPDATE collected_deals SET status='rejected' WHERE id=?").bind(String(body.id)).run();
      return Response.json({ ok: true });
    }
    if (body.action !== "approve" || body.imageRightsConfirmed !== true) throw new Error("Confirm image usage rights before publishing");
    const row = await env.DB.prepare("SELECT payload FROM collected_deals WHERE id=? AND status='pending'").bind(String(body.id)).first<{ payload: string }>();
    if (!row) throw new Error("Pending observation not found");
    const deal = validateCollectedDeal(JSON.parse(row.payload));
    const merchant = await env.DB.prepare("SELECT id FROM merchants WHERE id=? AND status='active'").bind(deal.merchant).first();
    if (!merchant) throw new Error("Merchant is not active");
    const listing = await env.DB.prepare("SELECT id, product_id AS productId, affiliate_url AS affiliateUrl FROM merchant_listings WHERE merchant=? AND merchant_product_id=?")
      .bind(deal.merchant, deal.merchantProductId).first<{ id: string; productId: string; affiliateUrl: string }>();
    const affiliateUrl = deal.merchant === "amazon" ? buildAmazonProductUrl(deal.merchantProductId) : String(body.affiliateUrl || listing?.affiliateUrl || "");
    if (deal.merchant === "ajio") {
      if (!isApprovedAjioLink(affiliateUrl) || new URL(new URL(affiliateUrl).searchParams.get("url")!).pathname !== new URL(deal.sourceUrl).pathname) throw new Error("Supply the ACE deep link for this product");
    }
    const productId = listing?.productId ?? crypto.randomUUID();
    const now = new Date().toISOString(), categorySlug = slugify(deal.category);
    const summary = String(body.summary ?? "").trim();
    if (summary.length < 20 || summary.length > 1000) throw new Error("Write an original summary of 20–1000 characters");
    await env.DB.batch([
      env.DB.prepare("INSERT INTO categories (id,name,slug,position,created_at) VALUES (?,?,?,0,?) ON CONFLICT(slug) DO NOTHING").bind(`cat-${categorySlug}`, deal.category, categorySlug, now),
      env.DB.prepare("INSERT INTO products (id,category_id,name,slug,summary,image_url,specs_json,status,source,created_at,updated_at,published_at) VALUES (?,(SELECT id FROM categories WHERE slug=?),?,?,?,?, '[]','published','browser_reviewed',?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,summary=excluded.summary,image_url=excluded.image_url,status='published',source='browser_reviewed',updated_at=excluded.updated_at,published_at=excluded.published_at")
        .bind(productId, categorySlug, deal.name, `${slugify(deal.name)}-${productId.slice(0,8)}`, summary, deal.imageUrl, now, now, now),
      env.DB.prepare("INSERT INTO merchant_listings (id,product_id,merchant,merchant_product_id,source_url,affiliate_url,status,last_checked_at,created_at,updated_at) VALUES (?,?,?,?,?,?,'active',?,?,?) ON CONFLICT(merchant,merchant_product_id) DO UPDATE SET affiliate_url=excluded.affiliate_url,last_checked_at=excluded.last_checked_at,updated_at=excluded.updated_at")
        .bind(listing?.id ?? crypto.randomUUID(), productId, deal.merchant, deal.merchantProductId, deal.sourceUrl, affiliateUrl, deal.checkedAt, now, now),
      env.DB.prepare("UPDATE collected_deals SET approved_payload=?,product_id=?,status='approved' WHERE id=?").bind(JSON.stringify(deal), productId, String(body.id)),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error && !/D1|SQLITE|SQL/i.test(error.message) ? error.message : "Could not save observation" }, { status: 400 });
  }
}
