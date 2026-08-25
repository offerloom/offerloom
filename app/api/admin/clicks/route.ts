import { authorizeAdminApi } from "../../../lib/admin-auth";

type ClickSummary = {
  totalClicks: number;
  uniqueProducts: number;
  lastSevenDays: number;
  byMerchant: Array<{ merchant: string; clicks: number }>;
  topProducts: Array<{ productId: string; name: string; clicks: number }>;
  recentDays: Array<{ day: string; clicks: number }>;
};

export async function GET() {
  if (!await authorizeAdminApi()) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { env } = await import("cloudflare:workers");
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totals, merchants, products, days] = await Promise.all([
    env.DB.prepare(`
      SELECT
        COUNT(*) AS totalClicks,
        COUNT(DISTINCT product_id) AS uniqueProducts,
        SUM(CASE WHEN clicked_at >= ? THEN 1 ELSE 0 END) AS lastSevenDays
      FROM outbound_clicks
    `).bind(sevenDaysAgo).first<{ totalClicks: number; uniqueProducts: number; lastSevenDays: number }>(),
    env.DB.prepare(`
      SELECT merchant, COUNT(*) AS clicks
      FROM outbound_clicks
      GROUP BY merchant
      ORDER BY clicks DESC
    `).all<{ merchant: string; clicks: number }>(),
    env.DB.prepare(`
      SELECT oc.product_id AS productId, p.name, COUNT(*) AS clicks
      FROM outbound_clicks oc
      JOIN products p ON p.id = oc.product_id
      GROUP BY oc.product_id
      ORDER BY clicks DESC
      LIMIT 15
    `).all<{ productId: string; name: string; clicks: number }>(),
    env.DB.prepare(`
      SELECT substr(clicked_at, 1, 10) AS day, COUNT(*) AS clicks
      FROM outbound_clicks
      WHERE clicked_at >= ?
      GROUP BY day
      ORDER BY day DESC
      LIMIT 30
    `).bind(thirtyDaysAgo).all<{ day: string; clicks: number }>(),
  ]);

  const summary: ClickSummary = {
    totalClicks: totals?.totalClicks ?? 0,
    uniqueProducts: totals?.uniqueProducts ?? 0,
    lastSevenDays: totals?.lastSevenDays ?? 0,
    byMerchant: merchants.results,
    topProducts: products.results,
    recentDays: days.results,
  };

  return Response.json(summary);
}
