import { isApprovedAjioCampaignLink } from "./ajio.ts";

const CAMPAIGN_ID = "1";
const PUBLISHER_ID = "1072";

const offers = [
  ["BUDA JEANS CO Under ₹399", "underrs399-240950"],
  ["GAP Min 55% off", "min55percentoff-241033"],
  ["GUESS Min 45% off", "min45percentoff-241091"],
  ["Handbags Min 80% off", "min80percentoff-240952"],
  ["MAX Under ₹399", "underrs399-240996"],
  ["Men Jeans Under ₹499", "underrs499-240948"],
  ["Moisturizers & Creams Under ₹399", "underrs399-241240"],
  ["Necklaces & Pendants Under ₹399", "underrs399-241028"],
  ["OLD NAVY Min 45% off", "min45percentoff-241275"],
  ["Perfumes & Colognes Under ₹399", "underrs399-241270"],
  ["PUMA Min 65% off", "min65percentoff-240957"],
  ["RARE RABBIT Min 55% off", "min55percentoff-241197"],
  ["Sarees Min 85% off", "min85percentoff-241065"],
  ["Shampoos & Conditioner Under ₹399", "underrs399-241169"],
  ["SHEIN Under ₹399", "underrs399-241090"],
  ["THE BEAR HOUSE Min 65% off", "min65percentoff-241180"],
  ["TIMEX Min 40% off", "min40percentoff-241375"],
  ["TOMMY HILFIGER Min 55% off", "min55percentoff-241008"],
  ["Trousers & Pants Under ₹399", "underrs399-240945"],
  ["WOODLAND Min 55% off", "min55percentoff-241304"],
  ["YOUSTA Under ₹399", "underrs399-241001"],
  ["ZIVAME Min 60% off", "min60percentoff-241451"],
] as const;

export const AJIO_CAMPAIGN_OFFERS = offers.map(([title, shortCode]) => {
  const destination = `https://www.ajio.com/s/${shortCode}`;
  const tracking = new URL("https://ajiotrk.vibconnect.in/click");
  tracking.searchParams.set("campaign_id", CAMPAIGN_ID);
  tracking.searchParams.set("pub_id", PUBLISHER_ID);
  tracking.searchParams.set("url", destination);
  const href = tracking.toString();
  if (!isApprovedAjioCampaignLink(href)) throw new Error(`Invalid AJIO campaign link: ${shortCode}`);
  return { title, shortCode, destination, href };
});
