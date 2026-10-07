function trackingDestination(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "ajiotrk.vibconnect.in" || url.port || url.username || url.password || url.pathname !== "/click") return null;
    if (url.searchParams.getAll("campaign_id").length !== 1 || url.searchParams.get("campaign_id") !== "1" || url.searchParams.getAll("pub_id").length !== 1 || url.searchParams.get("pub_id") !== "1072") return null;
    if (url.searchParams.getAll("url").length !== 1 || [...url.searchParams.keys()].some((key) => !["campaign_id", "pub_id", "p1", "p2", "url"].includes(key))) return null;
    if (url.searchParams.getAll("p1").length > 1 || (url.searchParams.has("p1") && url.searchParams.get("p1") !== "offerloom-site")) return null;
    if (url.searchParams.getAll("p2").length > 1 || (url.searchParams.has("p2") && !/^[a-z0-9-]+$/i.test(url.searchParams.get("p2") ?? ""))) return null;
    const destination = new URL(url.searchParams.get("url") ?? "");
    return destination.protocol === "https:" && destination.hostname === "www.ajio.com" && !destination.port && !destination.username && !destination.password && !destination.search && !destination.hash ? destination : null;
  } catch { return null; }
}

/** Accept only this publisher's dashboard-generated product deep links. */
export function isApprovedAjioLink(value: string): boolean {
  return /\/p\/\d+_[a-z0-9]+$/i.test(trackingDestination(value)?.pathname ?? "");
}

/** Validate ACE links that wrap an AJIO offer shortcut supplied by the partner. */
export function isApprovedAjioCampaignLink(value: string): boolean {
  const path = trackingDestination(value)?.pathname ?? "";
  return /\/s\/[a-z0-9]+(?:-curated)?-\d{6}$/i.test(path) || path === "/s/uhs1-min-40-percent-off-5629-90551";
}
