// TEMP read-only structure probe: 3 page loads total, no retries.
import { chromium } from "playwright";
const note = (m) => console.log(`::notice title=FK probe::${m.replace(/[\r\n%]/g, " ").slice(0, 900)}`);
const browser = await chromium.launch();
const page = await browser.newPage();
for (const url of ["https://www.flipkart.com/offers-store", "https://www.flipkart.com/offers-list/content?screen=dynamic&pk=themeViews%3DDT-OMU-Infinite-Scroll%3ADefault_Desktop~widgetType%3DdealCard~contentType%3Dneo&wid=2.dealCard.OMU_Infinite"]) {
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);
    const links = await page.$$eval("a[href*='/p/itm']", (as) => as.map((a) => a.getAttribute("href")));
    const anchors = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")).filter((h) => /^\/[a-z-]+\/(pr|~cs|clp)|offers-list|\/pr\?/.test(h)).slice(0, 12));
    note(`${url.slice(0, 60)} HTTP ${res?.status()} title="${await page.title()}" productLinks=${links.length} sample=${links.slice(0, 3).join(" ")} navLinks=${anchors.join(" ")}`);
  } catch (e) { note(`${url.slice(0, 60)} error ${e.message}`); }
}
await page.goto("https://www.flipkart.com/boat-airdopes-141-gen-2-bluetooth/p/itm441116d221f76", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).join(" ").slice(0, 700);
  const og = ["og:title", "og:image", "og:url"].map((p) => document.querySelector(`meta[property="${p}"]`)?.content);
  const h1 = document.querySelector("h1")?.textContent?.trim();
  const priceEls = [...document.querySelectorAll("div,span")].filter((e) => e.childElementCount === 0 && /^₹[\d,]+$/.test(e.textContent.trim())).slice(0, 6)
    .map((e) => `${e.textContent.trim()}|${e.className}|${getComputedStyle(e).textDecorationLine}|${getComputedStyle(e).fontSize}`);
  const crumbs = [...document.querySelectorAll("a[href]")].filter((a) => /\/pr\?|~cs|\/clp\//.test(a.getAttribute("href"))).slice(0, 6).map((a) => a.textContent.trim());
  return { ld, og, h1, priceEls, crumbs };
});
note(`PRODUCT h1=${info.h1} og=${JSON.stringify(info.og)}`);
note(`PRICES ${info.priceEls.join(" || ")}`);
note(`CRUMBS ${info.crumbs.join(" > ")}`);
note(`LD ${info.ld}`);
await browser.close();
