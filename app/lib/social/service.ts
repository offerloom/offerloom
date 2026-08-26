import { composeSocialPost } from "./compose";
import { socialSecretsFromEnv } from "./env";
import { isPublishSuccessful, publishToPlatforms, summarizePublishResults } from "./publish";
import type { PublishResult, SocialPlatform, SocialPostRecord, SocialPostStatus } from "./types";
import { SOCIAL_PLATFORMS } from "./types";

type DbLike = D1Database;

type EnvLike = {
  DB: D1Database;
  META_PAGE_ACCESS_TOKEN?: string;
  META_PAGE_ID?: string;
  META_INSTAGRAM_USER_ID?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  PUBLIC_SITE_URL?: string;
};

type SocialPostRow = {
  id: string;
  headline: string;
  body: string;
  link_url: string | null;
  image_url: string;
  platforms_json: string;
  caption: string;
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  publish_results_json: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export function parsePlatforms(value: unknown): SocialPlatform[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SocialPlatform => SOCIAL_PLATFORMS.includes(item as SocialPlatform));
}

function mapRow(row: SocialPostRow): SocialPostRecord {
  let publishResults: PublishResult[] | null = null;
  if (row.publish_results_json) {
    try {
      publishResults = JSON.parse(row.publish_results_json) as PublishResult[];
    } catch {
      publishResults = null;
    }
  }

  return {
    id: row.id,
    headline: row.headline,
    body: row.body,
    linkUrl: row.link_url,
    imageUrl: row.image_url,
    platforms: parsePlatforms(JSON.parse(row.platforms_json)),
    caption: row.caption,
    status: row.status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    publishResults,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSocialPosts(db: DbLike) {
  const result = await db.prepare(`
    SELECT id, headline, body, link_url, image_url, platforms_json, caption, status,
      scheduled_at, published_at, publish_results_json, last_error, created_at, updated_at
    FROM social_posts
    ORDER BY COALESCE(scheduled_at, created_at) DESC
    LIMIT 50
  `).all<SocialPostRow>();

  return (result.results ?? []).map(mapRow);
}

export async function getSocialPost(db: DbLike, id: string) {
  const row = await db.prepare(`
    SELECT id, headline, body, link_url, image_url, platforms_json, caption, status,
      scheduled_at, published_at, publish_results_json, last_error, created_at, updated_at
    FROM social_posts WHERE id = ?
  `).bind(id).first<SocialPostRow>();

  return row ? mapRow(row) : null;
}

export type CreateSocialPostInput = {
  headline: string;
  body?: string;
  linkUrl?: string;
  imageUrl?: string;
  platforms: SocialPlatform[];
  scheduledAt?: string | null;
  mode: "schedule" | "publish_now";
};

export async function createSocialPost(env: EnvLike, input: CreateSocialPostInput) {
  const secrets = socialSecretsFromEnv(env);
  const composed = composeSocialPost({
    headline: input.headline,
    body: input.body,
    linkUrl: input.linkUrl,
    imageUrl: input.imageUrl,
    siteOrigin: secrets.publicSiteUrl,
  });

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const scheduledAt = input.mode === "schedule" ? input.scheduledAt ?? null : null;
  let status: SocialPostStatus = input.mode === "schedule" ? "scheduled" : "draft";
  let publishedAt: string | null = null;
  let publishResults: PublishResult[] | null = null;
  let lastError: string | null = null;

  if (input.mode === "publish_now") {
    publishResults = await publishToPlatforms(input.platforms, composed.caption, composed.imageUrl, secrets);
    lastError = summarizePublishResults(publishResults);
    if (isPublishSuccessful(publishResults)) {
      status = "published";
      publishedAt = now;
    } else {
      status = "failed";
    }
  }

  await env.DB.prepare(`
    INSERT INTO social_posts (
      id, headline, body, link_url, image_url, platforms_json, caption, status,
      scheduled_at, published_at, publish_results_json, last_error, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    input.headline.trim(),
    (input.body ?? "").trim(),
    input.linkUrl?.trim() || null,
    composed.imageUrl,
    JSON.stringify(input.platforms),
    composed.caption,
    status,
    scheduledAt,
    publishedAt,
    publishResults ? JSON.stringify(publishResults) : null,
    lastError,
    now,
    now,
  ).run();

  return getSocialPost(env.DB, id);
}

export async function publishSocialPostNow(env: EnvLike, id: string) {
  const post = await getSocialPost(env.DB, id);
  if (!post) throw new Error("Social post not found.");
  if (post.status === "published") throw new Error("This post is already published.");

  const secrets = socialSecretsFromEnv(env);
  const publishResults = await publishToPlatforms(post.platforms, post.caption, post.imageUrl, secrets);
  const lastError = summarizePublishResults(publishResults);
  const now = new Date().toISOString();
  const status: SocialPostStatus = isPublishSuccessful(publishResults) ? "published" : "failed";

  await env.DB.prepare(`
    UPDATE social_posts
    SET status = ?, published_at = ?, publish_results_json = ?, last_error = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    status,
    status === "published" ? now : null,
    JSON.stringify(publishResults),
    lastError || null,
    now,
    id,
  ).run();

  return getSocialPost(env.DB, id);
}

export async function processDueSocialPosts(env: EnvLike) {
  const now = new Date().toISOString();
  const due = await env.DB.prepare(`
    SELECT id FROM social_posts
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?
    ORDER BY scheduled_at ASC
    LIMIT 10
  `).bind(now).all<{ id: string }>();

  const processed: Array<{ id: string; status: SocialPostStatus }> = [];
  for (const row of due.results ?? []) {
    try {
      const post = await publishSocialPostNow(env, row.id);
      if (post) processed.push({ id: post.id, status: post.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scheduled publish failed.";
      await env.DB.prepare(`
        UPDATE social_posts SET status = 'failed', last_error = ?, updated_at = ? WHERE id = ?
      `).bind(message, now, row.id).run();
      processed.push({ id: row.id, status: "failed" });
    }
  }

  return processed;
}

export async function cancelSocialPost(db: DbLike, id: string) {
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE social_posts SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'scheduled'
  `).bind(now, id).run();
}
