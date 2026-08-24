import { env } from "cloudflare:workers";
import { authorizeAdminApi } from "../../../lib/admin-auth";
import { normalizeAmazonProductUrl, slugify } from "../../../lib/amazon";

type CreateInput = {
  action?: "create";
  name?: string;
  category?: string;
  summary?: string;
  specs?: string;
  amazonUrl?: string;
  publish?: boolean;
};

type StatusInput = { action: "status"; productId?: string; status?: "draft" | "published" | "archived" };

export async function GET() {
  if (!await authorizeAdminApi()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result = await env.DB.prepare(`
    SELECT p.id, p.name, p.summary, p.status, p.updated_at AS updatedAt,
      c.name AS category, ml.id AS listingId, ml.merchant_product_id AS asin,
      ml.affiliate_url AS affiliateUrl
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant = 'amazon'
    ORDER BY p.updated_at DESC
  `).all();
  return Response.json({ products: result.results });
}

export async function POST(request: Request) {
  if (!await authorizeAdminApi()) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateInput | StatusInput;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.action === "status") {
    if (!body.productId || !["draft", "published", "archived"].includes(body.status ?? "")) {
      return Response.json({ error: "Invalid product status." }, { status: 400 });
    }
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE products SET status = ?, updated_at = ?, published_at = CASE WHEN ? = 'published' THEN ? ELSE published_at END WHERE id = ?")
      .bind(body.status, now, body.status, now, body.productId).run();
    return Response.json({ ok: true });
  }

  const name = body.name?.trim() ?? "";
  const category = body.category?.trim() ?? "";
  const summary = body.summary?.trim() ?? "";
  if (name.length < 3 || category.length < 2 || summary.length < 20 || !body.amazonUrl) {
    return Response.json({ error: "Name, category, Amazon URL and a useful description are required." }, { status: 400 });
  }

  let amazon;
  try { amazon = normalizeAmazonProductUrl(body.amazonUrl); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid Amazon URL." }, { status: 400 }); }

  const duplicate = await env.DB.prepare("SELECT id FROM merchant_listings WHERE merchant = 'amazon' AND merchant_product_id = ?")
    .bind(amazon.asin).first();
  if (duplicate) return Response.json({ error: "This Amazon ASIN is already in the catalogue." }, { status: 409 });

  const now = new Date().toISOString();
  const productId = crypto.randomUUID();
  const listingId = crypto.randomUUID();
  const categorySlug = slugify(category);
  const categoryId = `cat-${categorySlug}`;
  const productSlug = `${slugify(name)}-${productId.slice(0, 8)}`;
  const specs = (body.specs ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
  const status = body.publish ? "published" : "draft";

  await env.DB.batch([
    env.DB.prepare("INSERT INTO categories (id, name, slug, position, created_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(slug) DO UPDATE SET name = excluded.name")
      .bind(categoryId, category, categorySlug, now),
    env.DB.prepare("INSERT INTO products (id, category_id, name, slug, summary, specs_json, status, source, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?)")
      .bind(productId, categoryId, name, productSlug, summary, JSON.stringify(specs), status, now, now, status === "published" ? now : null),
    env.DB.prepare("INSERT INTO merchant_listings (id, product_id, merchant, merchant_product_id, source_url, affiliate_url, status, last_checked_at, created_at, updated_at) VALUES (?, ?, 'amazon', ?, ?, ?, 'active', ?, ?, ?)")
      .bind(listingId, productId, amazon.asin, amazon.sourceUrl, amazon.affiliateUrl, now, now, now),
  ]);

  return Response.json({ ok: true, productId, asin: amazon.asin, affiliateUrl: amazon.affiliateUrl }, { status: 201 });
}
