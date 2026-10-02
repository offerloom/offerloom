/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { runAutoSocialPost } from "../app/lib/social/auto-post";
import { processDueSocialPosts } from "../app/lib/social/service";
import { getSocialScheduleTask } from "../app/lib/social/schedule.mjs";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  META_PAGE_ACCESS_TOKEN?: string;
  META_PAGE_ID?: string;
  META_INSTAGRAM_USER_ID?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  PUBLIC_SITE_URL?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },

  async scheduled(event: { cron?: string }, env: Env): Promise<void> {
    const task = getSocialScheduleTask(event.cron);
    if (task === "ignore") {
      console.warn("Ignoring unconfigured social cron trigger:", event.cron ?? "<missing>");
      return;
    }

    if (task === "process-due") {
      const posts = await processDueSocialPosts(env);
      console.log("Scheduled social posts processed:", { cron: event.cron, count: posts.length, posts });
      const failed = posts.filter((post) => post.status === "failed");
      if (failed.length) throw new Error(`Social retry cron failed for posts: ${failed.map((post) => post.id).join(", ")}`);
      return;
    }

    const result = await runAutoSocialPost(env);
    if (!result?.ok) {
      const message = result?.post?.lastError || result?.reason || "Auto social post returned no result.";
      console.error("Auto social post did not publish:", {
        cron: event.cron,
        postId: result?.post?.id,
        status: result?.post?.status,
        lastError: message,
        platformResults: result?.post?.publishResults,
      });
      throw new Error(`Auto social post failed: ${message}`);
    }
    console.log("Auto social post published:", {
      cron: event.cron,
      postId: result.post?.id,
      platformResults: result.post?.publishResults,
    });
  },
};

export default worker;
