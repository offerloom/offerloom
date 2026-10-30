import { SITE } from "../site";
import { createSocialPost } from "./service";
import { BRAND_POSTS, brandCaption, brandHeadline, brandImagePath, isBrandDay, nextBrandIndex } from "./brand-posts.mjs";

type EnvLike = {
  DB: D1Database;
  META_PAGE_ACCESS_TOKEN?: string;
  META_PAGE_ID?: string;
  META_INSTAGRAM_USER_ID?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  PUBLIC_SITE_URL?: string;
};

/** Alternate-day OfferLoom brand post (quote card), separate from the daily deal posts. */
export async function runBrandPost(env: EnvLike, now = Date.now()) {
  if (!isBrandDay(now)) return { ok: true, skipped: "not a brand day" };
  const today = new Date(now + 19800000).toISOString().slice(0, 10);
  const rows = (await env.DB.prepare(
    "SELECT image_url AS imageUrl, created_at AS createdAt, status FROM social_posts WHERE image_url LIKE '%/brand/posts/%' ORDER BY created_at",
  ).all<{ imageUrl: string; createdAt: string; status: string }>()).results ?? [];
  // One attempt per brand day, even if it failed: no repeated Meta calls.
  if (rows.some((row) => new Date(Date.parse(row.createdAt) + 19800000).toISOString().slice(0, 10) === today)) {
    return { ok: true, skipped: "already attempted today" };
  }
  const lastPosted = new Map<number, string>();
  for (const row of rows) {
    const match = row.imageUrl.match(/\/brand\/posts\/(\d+)\.jpg/);
    if (match && row.status === "published") lastPosted.set(Number(match[1]) - 1, row.createdAt);
  }
  const index = nextBrandIndex(lastPosted);
  const linkUrl = SITE.publicUrl;
  const post = await createSocialPost(env, {
    headline: brandHeadline(index),
    body: BRAND_POSTS[index][1],
    linkUrl,
    imageUrl: `${SITE.publicUrl}${brandImagePath(index)}`,
    platforms: env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID ? ["facebook", "instagram", "telegram"] : ["facebook", "instagram"],
    mode: "publish_now",
    captionOverride: brandCaption(index, linkUrl),
  });
  return { ok: post?.status === "published", post, index };
}
