import { SITE } from "../site";
import { publicOffer } from "../public-offer";
import { buildHashtagLine } from "./hashtags";
import { createSocialPost } from "./service";

type EnvLike = {
  DB: D1Database;
  META_PAGE_ACCESS_TOKEN?: string;
  META_PAGE_ID?: string;
  META_INSTAGRAM_USER_ID?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  PUBLIC_SITE_URL?: string;
};

type CandidateRow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  imageUrl: string | null;
  merchant: string;
  approvedPayload: string | null;
};

const REPEAT_WINDOW_DAYS = 30;

async function findEligibleProduct(env: EnvLike) {
  const cutoff = new Date(Date.now() - REPEAT_WINDOW_DAYS * 86400000).toISOString();
  const result = await env.DB.prepare(`
    SELECT p.id, p.slug, p.name, p.summary, p.image_url AS imageUrl, ml.merchant, cd.approved_payload AS approvedPayload
    FROM products p
    JOIN merchant_listings ml ON ml.product_id = p.id AND ml.merchant IN ('amazon', 'ajio') AND ml.status = 'active'
    LEFT JOIN collected_deals cd ON cd.product_id = p.id AND cd.id = ml.merchant || '-' || ml.merchant_product_id
    WHERE p.status = 'published' AND p.image_url IS NOT NULL
      AND p.id NOT IN (
        SELECT product_id FROM social_posts
        WHERE product_id IS NOT NULL AND status = 'published' AND created_at >= ?
      )
  `).bind(cutoff).all<CandidateRow>();

  const withOffer = (result.results ?? [])
    .map((row) => ({ row, offer: publicOffer(row.approvedPayload) }))
    .filter((item): item is { row: CandidateRow; offer: NonNullable<ReturnType<typeof publicOffer>> } => Boolean(item.offer));

  if (!withOffer.length) return null;

  withOffer.sort((a, b) => {
    const discount = (offer: { price: number; mrp: number | null }) => (offer.mrp ? 1 - offer.price / offer.mrp : 0);
    return discount(b.offer) - discount(a.offer);
  });

  return withOffer[0];
}

export async function runAutoSocialPost(env: EnvLike) {
  const picked = await findEligibleProduct(env);
  if (!picked) return { ok: false, reason: "No eligible product with a fresh price and no post in the last 30 days." };

  const { row, offer } = picked;
  const hasDiscount = offer.mrp !== null && offer.mrp > offer.price;
  const priceLine = hasDiscount
    ? `₹${(offer.price / 100).toLocaleString("en-IN")} (was ₹${(offer.mrp! / 100).toLocaleString("en-IN")}, ${Math.round((1 - offer.price / offer.mrp!) * 100)}% off)`
    : `₹${(offer.price / 100).toLocaleString("en-IN")}`;
  const merchantLabel = row.merchant === "amazon" ? "Amazon.in" : "AJIO";
  const linkUrl = `${SITE.publicUrl}/products/${row.slug}`;
  const disclosure = row.merchant === "amazon"
    ? "#Ad — As an Amazon Associate I earn from qualifying purchases."
    : "#Ad — OfferLoom may earn a commission from this affiliate link.";

  const caption = [
    `🔥 ${row.name}`,
    `${priceLine} on ${merchantLabel}.`,
    row.summary,
    `👉 ${linkUrl}`,
    disclosure,
    buildHashtagLine(["OfferLoomIndia", "DealsToday"]),
  ].filter(Boolean).join("\n\n");

  // X (Twitter) has a 280-character hard limit — build a short variant instead of
  // truncating the long caption mid-sentence. The link and hashtags are kept intact;
  // only the headline is shortened if needed.
  const xSuffix = `\n${linkUrl}\n#OfferLoomIndia #DealsToday`;
  const xHeadline = `🔥 ${row.name} — ${priceLine} on ${merchantLabel}`;
  const xBudget = 280 - xSuffix.length;
  const xCaption = (xHeadline.length <= xBudget ? xHeadline : `${xHeadline.slice(0, Math.max(0, xBudget - 1))}…`) + xSuffix;

  // Instagram's media-download crawler is blocked by some merchant CDNs (Amazon's included)
  // even when Facebook's own crawler succeeds on the identical URL — route through our own
  // domain so both platforms fetch from us instead of hitting that block directly.
  const proxiedImageUrl = `${SITE.publicUrl}/api/social-image?src=${encodeURIComponent(row.imageUrl!)}`;

  const post = await createSocialPost(env, {
    headline: row.name,
    body: row.summary,
    linkUrl,
    imageUrl: proxiedImageUrl,
    platforms: ["facebook", "instagram", "whatsapp_channel", "x", "youtube_community"],
    mode: "publish_now",
    productId: row.id,
    captionOverride: caption,
    platformCaptions: { x: xCaption },
  });

  return { ok: post?.status === "published", post };
}
