// One-off, read-only: can a cloud browser read ONE known product page per merchant?
// No retries, no evasion. Reports status, title, and whether a price-like element exists.
import { chromium } from "playwright";
const pages = {
  flipkart: "https://www.flipkart.com/boat-airdopes-141-gen-2-bluetooth/p/itm441116d221f76",
  ajio: "https://www.ajio.com/rio-women-graphic-print-t-shirt--pyjamas-set/p/443121793_lilac",
};
const note = (m) => console.log(`::notice title=Merchant probe::${m.replace(/[\r\n%]/g, " ").slice(0, 600)}`);
const browser = await chromium.launch();
for (const [merchant, url] of Object.entries(pages)) {
  const page = await browser.newPage();
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4000);
    const body = (await page.locator("body").innerText()).slice(0, 4000);
    const prices = body.match(/₹\s?[\d,]+/g)?.slice(0, 4) ?? [];
    const challenge = /captcha|access denied|are you a human|unusual traffic|blocked|something went wrong/i.test(body);
    note(`${merchant}: HTTP ${res?.status()} | title="${(await page.title()).slice(0, 80)}" | prices=${prices.join(" ")} | challenge=${challenge} | text=${body.replace(/\s+/g, " ").slice(0, 160)}`);
  } catch (error) { note(`${merchant}: error ${error.message}`); }
  await page.close();
}
await browser.close();
