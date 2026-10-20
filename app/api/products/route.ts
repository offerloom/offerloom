import { env } from "cloudflare:workers";
import { publicOffer } from "../../lib/public-offer";
import { variantKey } from "../../lib/variant-key.mjs";

export async function GET(request: Request) {
  const merchantFilter = new URL(request.url).searchParams.get("merchant");
  const merchantClause = merchantFilter === "ajio" ? "AND ml.merchant = 'ajio'" : "";
  const result = await env.DB.prepare(`
    SELECT p.id, p.slug, p.brand, p.image_url AS imageUrl, p.model_number AS modelNumber, p.name, p.summary, p.specs_json AS specsJson,
      c.name AS category, p.published_at AS publishedAt, ml.id AS listingId, ml.merchant, m.name AS merchantName, cd.approved_payload AS approvedPayload
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant IN ('amazon', 'ajio', 'flipkart') AND ml.status = 'active'
    JOIN merchants m ON m.id = ml.merchant AND m.status = 'active'
    LEFT JOIN collected_deals cd ON cd.product_id=p.id AND cd.id=ml.merchant || '-' || ml.merchant_product_id
    WHERE p.status = 'published' ${merchantClause}
    ORDER BY COALESCE(ml.last_checked_at, p.published_at) DESC
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
    addedAt: row.publishedAt,
  }));
  // One card per product: keep the listing with the lowest current price, and record every store.
  type StoreOffer = { store: string; price: number | null };
  const byProduct = new Map<string, (typeof products)[number] & { stores: string[]; storeOffers: StoreOffer[] }>();
  for (const product of products) {
    const storeOffer = { store: product.merchantName as string, price: product.offer?.price ?? null };
    const current = byProduct.get(product.id as string);
    if (!current) { byProduct.set(product.id as string, { ...product, stores: [storeOffer.store], storeOffers: [storeOffer] }); continue; }
    current.stores.push(storeOffer.store);
    current.storeOffers.push(storeOffer);
    const better = product.offer && (!current.offer || product.offer.price < current.offer.price);
    if (better) Object.assign(current, { ...product, stores: current.stores, storeOffers: current.storeOffers, collectionSources: [...new Set([...current.collectionSources, ...product.collectionSources])] });
  }
  // Colour variants of the same product at the same price show as one card (with a count); a different price stays separate.
  type Grouped = NonNullable<ReturnType<typeof byProduct.get>> & { variantCount: number };
  const byVariant = new Map<string, Grouped>();
  for (const product of byProduct.values()) {
    const key = variantKey(product.name, product.offer?.price ?? null);
    const current = byVariant.get(key);
    if (!current) byVariant.set(key, { ...product, variantCount: 1 });
    else {
      current.variantCount += 1;
      if (product.storeOffers.length > current.storeOffers.length) Object.assign(current, { ...product, variantCount: current.variantCount });
    }
  }
  return Response.json({ products: [...byVariant.values()] }, { headers: { "Cache-Control": "no-store" } });
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
