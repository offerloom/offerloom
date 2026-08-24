import { env } from "cloudflare:workers";
import { authorizeAdminApi } from "../../../lib/admin-auth";
import { normalizeAmazonProductUrl, slugify } from "../../../lib/amazon";
import { parseProductCsv, type CsvProductRow } from "../../../lib/csv";

type CreateInput = {
  action?: "create";
  name?: string;
  brand?: string;
  modelNumber?: string;
  category?: string;
  summary?: string;
  specs?: string;
  amazonUrl?: string;
  publish?: boolean;
};

type StatusInput = { action: "status"; productId?: string; status?: "draft" | "published" | "archived" };
type BulkInput = { action: "bulk_import"; csv?: string };

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

  let body: CreateInput | StatusInput | BulkInput;
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

  if (body.action === "bulk_import") {
    let rows: CsvProductRow[];
    try { rows = parseProductCsv(body.csv ?? ""); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid CSV." }, { status: 400 }); }
    if (rows.length > 500) return Response.json({ error: "Import a maximum of 500 products at a time." }, { status: 400 });

    const prepared: Array<{ row:number; input:CsvProductRow; amazon:ReturnType<typeof normalizeAmazonProductUrl> }> = [];
    const errors: string[] = [];
    const seenAsins = new Set<string>();
    rows.forEach((input, offset) => {
      const row = offset + 2;
      if (input.name.length < 3 || input.category.length < 2 || input.summary.length < 20) {
        errors.push(`Row ${row}: name, category and an original summary of at least 20 characters are required.`); return;
      }
      try {
        const amazon = normalizeAmazonProductUrl(input.amazonUrl);
        if (seenAsins.has(amazon.asin)) errors.push(`Row ${row}: duplicate ASIN ${amazon.asin} in this file.`);
        else { seenAsins.add(amazon.asin); prepared.push({ row, input, amazon }); }
      } catch (error) { errors.push(`Row ${row}: ${error instanceof Error ? error.message : "invalid Amazon URL."}`); }
    });
    if (errors.length) return Response.json({ error: "Fix the CSV before importing.", errors: errors.slice(0, 50) }, { status: 400 });

    const existing = new Set<string>();
    for (let offset = 0; offset < prepared.length; offset += 80) {
      const group = prepared.slice(offset, offset + 80);
      const placeholders = group.map(() => "?").join(",");
      const found = await env.DB.prepare(`SELECT merchant_product_id AS asin FROM merchant_listings WHERE merchant = 'amazon' AND merchant_product_id IN (${placeholders})`)
        .bind(...group.map((item) => item.amazon.asin)).all<{ asin:string }>();
      found.results.forEach((item) => existing.add(item.asin));
    }

    const imports = prepared.filter((item) => !existing.has(item.amazon.asin));
    for (let offset = 0; offset < imports.length; offset += 25) {
      const statements = imports.slice(offset, offset + 25).flatMap(({ input, amazon }) => createProductStatements(input, amazon, "bulk_csv"));
      if (statements.length) await env.DB.batch(statements);
    }
    return Response.json({ ok:true, imported:imports.length, skipped:existing.size, total:rows.length });
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

  const statements = createProductStatements({ amazonUrl:body.amazonUrl ?? "", brand:body.brand?.trim() ?? "", modelNumber:body.modelNumber?.trim() ?? "", name, category, summary, specs:body.specs ?? "", publish:Boolean(body.publish) }, amazon, "manual");
  await env.DB.batch(statements);

  return Response.json({ ok: true, asin: amazon.asin, affiliateUrl: amazon.affiliateUrl }, { status: 201 });
}

function createProductStatements(input: CsvProductRow, amazon: ReturnType<typeof normalizeAmazonProductUrl>, source: "manual" | "bulk_csv") {
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();
  const listingId = crypto.randomUUID();
  const categorySlug = slugify(input.category);
  const categoryId = `cat-${categorySlug}`;
  const productSlug = `${slugify(input.name)}-${productId.slice(0, 8)}`;
  const specs = input.specs.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
  const status = input.publish ? "published" : "draft";
  return [
    env.DB.prepare("INSERT INTO categories (id, name, slug, position, created_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(slug) DO UPDATE SET name = excluded.name")
      .bind(categoryId, input.category, categorySlug, now),
    env.DB.prepare("INSERT INTO products (id, category_id, brand, model_number, name, slug, summary, specs_json, status, source, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(productId, categoryId, input.brand || null, input.modelNumber || null, input.name, productSlug, input.summary, JSON.stringify(specs), status, source, now, now, status === "published" ? now : null),
    env.DB.prepare("INSERT INTO merchant_listings (id, product_id, merchant, merchant_product_id, source_url, affiliate_url, status, last_checked_at, created_at, updated_at) VALUES (?, ?, 'amazon', ?, ?, ?, 'active', ?, ?, ?)")
      .bind(listingId, productId, amazon.asin, amazon.sourceUrl, amazon.affiliateUrl, now, now, now),
  ];
}
