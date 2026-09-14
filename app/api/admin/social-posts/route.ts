import { env } from "cloudflare:workers";
import { authorizeAdminApi } from "../../../lib/admin-auth";
import { socialConnectorStatus, socialSecretsFromEnv } from "../../../lib/social/env";
import {
  cancelSocialPost,
  createSocialPost,
  listSocialPosts,
  parsePlatforms,
  processDueSocialPosts,
  publishSocialPostNow,
} from "../../../lib/social/service";
import { SOCIAL_PLATFORMS } from "../../../lib/social/types";

type CreateBody = {
  action?: "create";
  mode?: "schedule" | "publish_now";
  headline?: string;
  body?: string;
  linkUrl?: string;
  imageUrl?: string;
  platforms?: string[];
  scheduledAt?: string;
};

type ActionBody =
  | { action: "publish_now"; postId?: string }
  | { action: "cancel"; postId?: string }
  | { action: "process_due" };

export async function GET() {
  if (!await authorizeAdminApi()) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await processDueSocialPosts(env);
  const posts = await listSocialPosts(env.DB);
  const connectors = socialConnectorStatus(socialSecretsFromEnv(env));

  return Response.json({ posts, connectors, platforms: SOCIAL_PLATFORMS });
}

export async function POST(request: Request) {
  if (!await authorizeAdminApi()) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateBody | ActionBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.action === "publish_now") {
    if (!body.postId) return Response.json({ error: "Post ID is required." }, { status: 400 });
    try {
      const post = await publishSocialPostNow(env, body.postId);
      return Response.json({ post });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Publish failed." }, { status: 400 });
    }
  }

  if (body.action === "cancel") {
    if (!body.postId) return Response.json({ error: "Post ID is required." }, { status: 400 });
    await cancelSocialPost(env.DB, body.postId);
    return Response.json({ ok: true });
  }

  if (body.action === "process_due") {
    const processed = await processDueSocialPosts(env);
    return Response.json({ processed });
  }

  const createBody = body as CreateBody;
  const headline = createBody.headline?.trim() ?? "";
  const platforms = parsePlatforms(createBody.platforms);
  const mode = createBody.mode === "schedule" ? "schedule" : "publish_now";

  if (headline.length < 5) return Response.json({ error: "Headline must be at least 5 characters." }, { status: 400 });
  if (platforms.length === 0) return Response.json({ error: "Choose at least one platform." }, { status: 400 });

  if (mode === "schedule") {
    if (!createBody.scheduledAt) return Response.json({ error: "Choose a schedule date and time." }, { status: 400 });
    const scheduled = new Date(createBody.scheduledAt);
    if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() <= Date.now()) {
      return Response.json({ error: "Schedule time must be in the future." }, { status: 400 });
    }
  }

  const post = await createSocialPost(env, {
    headline,
    body: createBody.body,
    linkUrl: createBody.linkUrl,
    imageUrl: createBody.imageUrl,
    platforms,
    scheduledAt: createBody.scheduledAt ?? null,
    mode,
  });

  return Response.json({ post });
}
