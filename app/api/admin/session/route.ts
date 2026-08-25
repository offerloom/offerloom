import { env } from "cloudflare:workers";

const SESSION_COOKIE = "offerloom_admin_session";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  if (env.DEPLOYMENT_PLATFORM !== "workers") {
    return Response.json({ error: "Admin session login is only used on Workers deployments." }, { status: 404 });
  }

  const adminToken = env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return Response.json({ error: "ADMIN_API_TOKEN is not configured on the Worker." }, { status: 503 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.token !== adminToken) {
    return Response.json({ error: "Invalid admin token." }, { status: 401 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=${adminToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ONE_WEEK_SECONDS}`,
    },
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    },
  });
}
