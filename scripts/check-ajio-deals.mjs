import { pathToFileURL } from "node:url";

export function summarizeDeals(payload) {
  if (!payload || !Array.isArray(payload.deals)) {
    throw new Error("Unexpected deals response; no catalogue changes were made.");
  }
  const deals = payload.deals.filter((deal) =>
    deal && Number(deal.campaign_id) === 1 && deal.status === "active"
  );
  return {
    received: payload.deals.length,
    activeAjioDeals: deals.length,
    deals: deals.map((deal) => ({
      id: String(deal.id ?? ""),
      name: String(deal.name ?? "").slice(0, 200),
      campaignId: 1,
    })),
    hasNextPage: Boolean(payload.pageToken),
  };
}

export async function checkDeals(apiKey, fetcher = fetch) {
  if (!apiKey?.trim()) throw new Error("Set AJIO_API_KEY privately before running this check.");
  const summaries = [];
  const seenTokens = new Set();
  let pageToken;
  for (let page = 0; page < 20; page += 1) {
    const url = new URL("https://api.trackier.com/v2/publishers/deals");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    let response;
    try {
      response = await fetcher(url, {
        headers: { "X-Api-Key": apiKey.trim(), Accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new Error("AJIO deals request failed; check connectivity and retry.");
    }
    if (!response.ok) throw new Error(`AJIO deals request returned HTTP ${response.status}.`);
    let payload;
    try { payload = await response.json(); } catch {
      throw new Error("AJIO returned an invalid JSON response.");
    }
    summaries.push(summarizeDeals(payload));
    if (payload.deals.length === 0) return { complete: true, pages: summaries };
    pageToken = Object.hasOwn(payload, "nextPageToken") ? payload.nextPageToken : payload.pageToken;
    if (!pageToken) return { complete: true, pages: summaries };
    if (typeof pageToken !== "string" || seenTokens.has(pageToken)) {
      throw new Error("AJIO returned an invalid pagination token.");
    }
    seenTokens.add(pageToken);
  }
  return { complete: false, pages: summaries };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await checkDeals(process.env.AJIO_API_KEY), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
