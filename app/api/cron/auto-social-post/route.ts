import { env } from "cloudflare:workers";
import { runAutoSocialPost } from "../../../lib/social/auto-post";

export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutoSocialPost(env);
  return Response.json(result);
}
