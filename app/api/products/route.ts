import { env } from "cloudflare:workers";
import { publicOffer } from "../../lib/public-offer";

export async function GET() {
  const result = await env.DB.prepare(`
    SELECT p.id, p.slug, p.brand, p.image_url AS imageUrl, p.model_number AS modelNumber, p.name, p.summary, p.specs_json AS specsJson,
      c.name AS category, ml.id AS listingId, ml.merchant, m.name AS merchantName, cd.approved_payload AS approvedPayload
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant IN ('amazon', 'ajio') AND ml.status = 'active'
    JOIN merchants m ON m.id = ml.merchant AND m.status = 'active'
    LEFT JOIN collected_deals cd ON cd.product_id=p.id AND cd.id=ml.merchant || '-' || ml.merchant_product_id
    WHERE p.status = 'published'
    ORDER BY p.published_at DESC
    LIMIT 100
  `).all();

  const products = result.results.map((row) => ({
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    imageUrl: row.imageUrl,
    offer: publicOffer(row.approvedPayload),
    collectionSources: safeCollectionSources(row.approvedPayload),
    modelNumber: row.modelNumber,
    name: row.name,
    summary: row.summary,
    category: row.category,
    specs: safeSpecs(row.specsJson),
    merchantName: row.merchantName,
    merchant: row.merchant,
    outboundPath: `/go/${row.merchant}/${row.listingId}`,
    detailPath: `/products/${row.slug}`,
  }));
  return Response.json({ products }, { headers: { "Cache-Control": "no-store" } });
}

function safeCollectionSources(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value));
    const sources = Array.isArray(parsed.discoverySources) ? parsed.discoverySources : parsed.discoverySource ? [parsed.discoverySource] : [];
    return sources.filter((source: unknown): source is string => ["todays_deals", "new_releases", "bestsellers"].includes(String(source)));
  } catch { return []; }
}

function safeSpecs(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}
