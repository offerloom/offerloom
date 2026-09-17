import { env } from "cloudflare:workers";
import { publicOffer } from "../lib/public-offer";
import { SITE } from "../lib/site";

// Meta Commerce Manager data feed: https://www.facebook.com/business/help/120325381656392
// Required for Instagram/Facebook Shopping product tagging. Register this URL as a
// "Scheduled feed" in Commerce Manager once a catalog is created.
const REQUIRED_COLUMNS = ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand"];

function csvField(value: string) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const result = await env.DB.prepare(`
    SELECT p.id, p.slug, p.brand, p.image_url AS imageUrl, p.name, p.summary,
      ml.merchant, cd.approved_payload AS approvedPayload
    FROM products p
    JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant IN ('amazon', 'ajio') AND ml.status = 'active'
    LEFT JOIN collected_deals cd ON cd.product_id = p.id AND cd.id = ml.merchant || '-' || ml.merchant_product_id
    WHERE p.status = 'published' AND p.image_url IS NOT NULL
  `).all<{ id: string; slug: string; brand: string | null; imageUrl: string; name: string; summary: string; merchant: string; approvedPayload: string | null }>();

  const rows = (result.results ?? [])
    .map((row) => ({ row, offer: publicOffer(row.approvedPayload) }))
    .filter((item): item is { row: typeof result.results[number]; offer: NonNullable<ReturnType<typeof publicOffer>> } => Boolean(item.offer))
    .map(({ row, offer }) => [
      row.id,
      row.name,
      row.summary,
      "in stock",
      "new",
      `${(offer.price / 100).toFixed(2)} INR`,
      `${SITE.publicUrl}/products/${row.slug}`,
      row.imageUrl,
      row.brand || SITE.brand,
    ].map(csvField).join(","));

  const csv = [REQUIRED_COLUMNS.join(","), ...rows].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
