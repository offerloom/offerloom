// TEMP read-only: one listing page + one product page on Myntra. No retries.
import { chromium } from "playwright";
const note = (m) => console.log(`::notice title=Myntra probe::${m.replace(/[\r\n%]/g, " ").slice(0, 900)}`);
const browser = await chromium.launch();
const page = await browser.newPage();
try {
  const res = await page.goto("https://www.myntra.com/men-tshirts", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(5000);
  const body = (await page.locator("body").innerText()).slice(0, 3000);
  const links = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")).filter((h) => /\/\d{6,}\/buy$/.test(h)));
  note(`listing HTTP ${res?.status()} title="${await page.title()}" productLinks=${links.length} sample=${links.slice(0, 2).join(" ")} text=${body.replace(/\s+/g, " ").slice(0, 200)}`);
  if (links[0]) {
    await page.waitForTimeout(5000);
    const r2 = await page.goto(new URL(links[0], "https://www.myntra.com").href, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4000);
    const t = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    note(`product HTTP ${r2?.status()} title="${(await page.title()).slice(0, 90)}" prices=${(t.match(/(Rs\.|₹)\s?[\d,]+/g) ?? []).slice(0, 4).join(" ")} text=${t.slice(0, 200)}`);
  }
} catch (e) { note(`error ${e.message}`); }
await browser.close();
