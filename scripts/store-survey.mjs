// TEMP read-only survey: one listing page per store, no retries. Reports access + whether products/prices are readable.
import { chromium } from "playwright";
const note = (m) => console.log(`::notice title=Store survey::${m.replace(/[\r\n%]/g, " ").slice(0, 600)}`);
const stores = {
  "Tata CLiQ": "https://www.tatacliq.com/search/?searchCategory=all&text=earbuds",
  "Nykaa": "https://www.nykaa.com/skin/c/8377",
  "Vijay Sales": "https://www.vijaysales.com/search-listing?q=earbuds",
  "Snapdeal": "https://www.snapdeal.com/search?keyword=earbuds",
  "Meesho": "https://www.meesho.com/search?q=earbuds",
  "JioMart": "https://www.jiomart.com/search/earbuds",
  "Shopsy": "https://www.shopsy.in/search?q=earbuds",
  "Pepperfry": "https://www.pepperfry.com/category/sofas.html",
  "FirstCry": "https://www.firstcry.com/toys",
  "Decathlon": "https://www.decathlon.in/sports/running",
  "Lenskart": "https://www.lenskart.com/eyeglasses.html",
  "boAt": "https://www.boat-lifestyle.com/collections/true-wireless-earbuds",
  "Bewakoof": "https://www.bewakoof.com/men-t-shirts",
  "The Souled Store": "https://www.thesouledstore.com/men/t-shirts",
};
const challenge = /access denied|captcha|are you a human|unusual traffic|verify you are human|something went wrong|site maintenance|request blocked|forbidden/i;
const browser = await chromium.launch();
for (const [name, url] of Object.entries(stores)) {
  const page = await browser.newPage();
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
    await page.waitForTimeout(6000);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const prices = (text.match(/(₹|Rs\.?)\s?[\d,]{2,}/g) ?? []).length;
    const blocked = (res?.status() ?? 0) >= 400 || challenge.test(text.slice(0, 1500)) || challenge.test(await page.title());
    note(`${name}: HTTP ${res?.status()} | ${blocked ? "BLOCKED" : prices >= 5 ? "READABLE" : "UNCLEAR"} | prices=${prices} | title="${(await page.title()).slice(0, 60)}"`);
  } catch (e) { note(`${name}: ERROR ${e.message.slice(0, 120)}`); }
  await page.close();
  await new Promise((r) => setTimeout(r, 2000));
}
await browser.close();
