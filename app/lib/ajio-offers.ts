const CAMPAIGN_ID = "1";
const PUBLISHER_ID = "1072";

/** Build this publisher's ACE tracking link for an AJIO offer short code supplied by AJIO. */
export function ajioCampaignHref(shortCode: string): string {
  const destination = `https://www.ajio.com/s/${shortCode}`;
  return `https://ajiotrk.vibconnect.in/click?campaign_id=${CAMPAIGN_ID}&pub_id=${PUBLISHER_ID}&p1=offerloom-site&p2=${shortCode}&url=${destination}`;
}

export type AjioCampaignOffer = { shortCode: string; title: string; campaign: string; validFrom: string; validThrough: string; href: string };
