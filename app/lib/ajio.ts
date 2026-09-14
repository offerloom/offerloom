/** Accept only this publisher's dashboard-generated product deep links. */
export function isApprovedAjioLink(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "ajiotrk.vibconnect.in" || url.port || url.username || url.password || url.pathname !== "/click") return false;
    if (url.searchParams.getAll("campaign_id").length !== 1 || url.searchParams.get("campaign_id") !== "1" || url.searchParams.getAll("pub_id").length !== 1 || url.searchParams.get("pub_id") !== "1072") return false;
    if (url.searchParams.getAll("url").length !== 1) return false;
    const destination = new URL(url.searchParams.get("url") ?? "");
    return destination.protocol === "https:" && destination.hostname === "www.ajio.com" && !destination.port && !destination.username && !destination.password && /\/p\/\d+_[a-z0-9]+$/i.test(destination.pathname);
  } catch { return false; }
}
