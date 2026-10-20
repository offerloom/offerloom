// TEMP read-only: can a cloud browser read Croma / Reliance Digital search + product pages? No retries.
import { chromium } from "playwright";
const note = (m) => console.log(`::notice title=Store probe::${m.replace(/[\r\n%]/g, " ").slice(0, 900)}`);
const stores = {
  croma: { search: "https://www.croma.com/searchB?q=boat%20airdopes%20141", product: /\/p\/\d+/ , base: "https://www.croma.com" },
  reliance: { search: "https://www.reliancedigital.in/products?q=boat%20airdopes%20141", product: /\/product\/|\/p\/\d+|\d{9}/, base: "https://www.reliancedigital.in" },
};
const browser = await chromium.launch();
for (const [name, store] of Object.entries(stores)) {
  const page = await browser.newPage();
  try {
    const res = await page.goto(store.search, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(6000);
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const links = [...new Set(await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href"))))].filter((h) => store.product.test(h ?? ""));
    note(`${name} search HTTP ${res?.status()} title="${(await page.title()).slice(0, 70)}" productLinks=${links.length} sample=${links.slice(0, 2).join(" ")} prices=${(text.match(/₹\s?[\d,]+/g) ?? []).slice(0, 4).join(" ")} text=${text.slice(0, 160)}`);
    if (links[0]) {
      await page.waitForTimeout(5000);
      const r2 = await page.goto(new URL(links[0], store.base).href, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(5000);
      const t2 = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      const ld = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => x.textContent).join(" ").slice(0, 300));
      note(`${name} product HTTP ${r2?.status()} title="${(await page.title()).slice(0, 70)}" prices=${(t2.match(/₹\s?[\d,]+/g) ?? []).slice(0, 4).join(" ")} ld=${ld}`);
    }
  } catch (e) { note(`${name} error ${e.message}`); }
  await page.close();
}
await browser.close();
