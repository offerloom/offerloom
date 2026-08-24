import { env } from "cloudflare:workers";

export async function GET() {
  const result = await env.DB.prepare(`
    SELECT p.id, p.slug, p.brand, p.model_number AS modelNumber, p.name, p.summary, p.specs_json AS specsJson,
      c.name AS category, ml.id AS listingId
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant = 'amazon' AND ml.status = 'active'
    WHERE p.status = 'published'
    ORDER BY p.published_at DESC
    LIMIT 100
  `).all();

  const products = result.results.map((row) => ({
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    modelNumber: row.modelNumber,
    name: row.name,
    summary: row.summary,
    category: row.category,
    specs: safeSpecs(row.specsJson),
    outboundPath: `/go/amazon/${row.listingId}`,
    detailPath: `/products/${row.slug}`,
  }));
  return Response.json({ products }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}

function safeSpecs(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}
