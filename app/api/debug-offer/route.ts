import { env } from "cloudflare:workers";
import { publicOffer } from "../../../lib/public-offer";

export async function GET() {
  const row = await env.DB.prepare(`
    SELECT cd.approved_payload AS approvedPayload
    FROM collected_deals cd WHERE cd.id = 'amazon-B0FP2D6Z16'
  `).first<{ approvedPayload: string }>();
  const now = Date.now();
  let parsed: unknown = null;
  let parseError: string | null = null;
  try { parsed = JSON.parse(String(row?.approvedPayload)); } catch (e) { parseError = e instanceof Error ? e.message : String(e); }
  return Response.json({
    raw: row?.approvedPayload ?? null,
    parsed,
    parseError,
    now,
    nowIso: new Date(now).toISOString(),
    offerResult: publicOffer(row?.approvedPayload, now),
  });
}
