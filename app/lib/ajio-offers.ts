import { isApprovedAjioCampaignLink } from "./ajio.ts";

const CAMPAIGN_ID = "1";
const PUBLISHER_ID = "1072";

/** Current All Stars Sale callouts supplied by AJIO ACE for 7–11 October 2026. */
const offers = [
  ["USPA Shirts at ₹749", "uspashirtsat749curated-413395"],
  ["Highlander Shirts at ₹499", "atrs499-219228"],
  ["The Indian Garage Shirts at ₹399", "atrs399-220176"],
  ["The Indian Garage Denim at ₹599", "atrs599-220177"],
  ["Gosriki & Kiana ethnic sets at ₹599", "atrs599-219284"],
  ["Armani Exchange: flat 40% + extra 15%", "uhs1-min-40-percent-off-5629-90551"],
  ["Levi’s Jeans at ₹899", "atrs999-199890"],
  ["Red Tape: up to 86% off", "min86percentoff-177520"],
  ["Decathlon under ₹699", "underrs699-curated-413317"],
  ["Technosport & Performax under ₹399", "underrs399-curated-413311"],
  ["Puma shoes at ₹1,199", "pumashoesat1199-122531"],
  ["Puma: up to 70% off", "min70percentoff-177543"],
  ["Nike: flat 50% off", "flat50percentoff-220741"],
  ["Portico: flat 50% off", "flat50percentoff-123524"],
] as const;

export const AJIO_CAMPAIGN_OFFERS = offers.map(([title, shortCode]) => {
  const destination = `https://www.ajio.com/s/${shortCode}`;
  const tracking = new URL("https://ajiotrk.vibconnect.in/click");
  const href = `${tracking.origin}${tracking.pathname}?campaign_id=${CAMPAIGN_ID}&pub_id=${PUBLISHER_ID}&p1=offerloom-site&p2=${shortCode}&url=${destination}`;
  if (!isApprovedAjioCampaignLink(href)) throw new Error(`Invalid AJIO campaign link: ${shortCode}`);
  return { title, shortCode, destination, href, validThrough: "2026-10-11" };
});
