import { env } from "cloudflare:workers";
import { processDueSocialPosts } from "../../../lib/social/service";

export async function GET(request: Request) {
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processDueSocialPosts(env);
  return Response.json({ ok: true, processed });
}
