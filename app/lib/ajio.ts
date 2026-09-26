function trackingDestination(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "ajiotrk.vibconnect.in" || url.port || url.username || url.password || url.pathname !== "/click") return null;
    if (url.searchParams.getAll("campaign_id").length !== 1 || url.searchParams.get("campaign_id") !== "1" || url.searchParams.getAll("pub_id").length !== 1 || url.searchParams.get("pub_id") !== "1072") return null;
    if (url.searchParams.getAll("url").length !== 1 || [...url.searchParams.keys()].some((key) => !["campaign_id", "pub_id", "url"].includes(key))) return null;
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
  return /\/s\/[a-z0-9]+-\d{6}$/i.test(trackingDestination(value)?.pathname ?? "");
}
