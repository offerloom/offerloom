import { env } from "cloudflare:workers";
import { ajioCampaignHref } from "../../lib/ajio-offers";
import { isApprovedAjioCampaignLink } from "../../lib/ajio";

type Row = { shortCode: string; title: string; campaign: string; validFrom: string; validThrough: string };

/** Current AJIO ACE campaign offers imported from AJIO Affiliate Support emails. */
export async function GET() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("/");
  const today = `${parts[2]}-${parts[1]}-${parts[0]}`;
  let rows: Row[] = [];
  try {
    const result = await env.DB.prepare(`
      SELECT short_code AS shortCode, title, campaign, valid_from AS validFrom, valid_through AS validThrough
      FROM ajio_campaign_offers WHERE valid_through >= ? ORDER BY valid_through DESC, updated_at DESC, title LIMIT 60
    `).bind(today).all<Row>();
    rows = result.results ?? [];
  } catch { rows = []; }
  const offers = rows
    .map((row) => ({ ...row, href: ajioCampaignHref(row.shortCode) }))
    .filter((offer) => isApprovedAjioCampaignLink(offer.href));
  return Response.json({ offers }, { headers: { "cache-control": "public, max-age=300" } });
}
