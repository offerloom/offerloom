const API = "https://api.github.com/repos/offerloom/offerloom/actions/workflows/cloud-collector.yml";
const ACTIVE = new Set(["queued", "in_progress", "waiting", "pending", "requested"]);

async function github(path, token, fetcher, body) {
  const response = await fetcher(API + path, {
    method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "OfferLoom-collector-scheduler", ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`GitHub scheduler request failed (${response.status})`); }
  if (response.status === 204) return null;
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let text = "", size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1000000) { await reader.cancel(); throw new Error("GitHub response exceeded scheduler limit"); }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

export async function dispatchDaily(env, { now = Date.now(), fetcher = fetch } = {}) {
  if (env.ENABLED !== "true") return { status: "disabled" };
  if (!env.GITHUB_ACTIONS_TOKEN) throw new Error("GitHub Actions scheduler credential is missing");
  const day = new Date(now + 19800000).toISOString().slice(0, 10);
  const start = Date.parse(`${day}T00:00:00+05:30`);
  const data = await github("/runs?branch=main&per_page=20", env.GITHUB_ACTIONS_TOKEN, fetcher);
  if (!Array.isArray(data?.workflow_runs)) throw new Error("GitHub run history is invalid");
  const today = data.workflow_runs.filter((run) => run.display_title === "Cloud catalogue · publish" && Date.parse(run.created_at) >= start);
  if (today.some((run) => ACTIVE.has(run.status))) return { status: "skipped", reason: "Publication is queued or running", day };
  if (today.some((run) => run.conclusion === "success")) return { status: "skipped", reason: "Publication completed today", day };
  if (today.length >= 3) throw new Error("Daily publication retry limit reached; inspect GitHub Actions");
  await github("/dispatches", env.GITHUB_ACTIONS_TOKEN, fetcher, { ref: "main", inputs: { probe: false, force: false } });
  return { status: "dispatched", day };
}

export default {
  scheduled(_event, env, ctx) {
    ctx.waitUntil(dispatchDaily(env).then((result) => console.log(JSON.stringify({ job: "collector-scheduler", ...result }))));
  },
};
