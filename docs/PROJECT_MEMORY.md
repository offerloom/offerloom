# OfferLoom Project Memory

Updated: 26 August 2026

Read this file, `README.md`, `AGENTS.md`, and `docs/PROJECT_HANDOFF.md` before changing the project.

## Current checkpoint

- OfferLoom is an India-first product-discovery and price-comparison website operated by Parthsheel Enterprises.
- **Default development branch:** `offerloom` (tracks `origin/offerloom`). `main` remains the stable/release branch.
- Public site (Workers): <https://offerloom.contact-offerloom.workers.dev>
- Legacy ChatGPT Sites URL: <https://offerloom.gdwivedi6.chatgpt.site>
- Local repository: `/Users/gauravdwivedi/Documents/gaurav/parthsheel_enterprises/offerloom`
- Stack: Vinext, React, TypeScript, Cloudflare Worker, D1 and Drizzle.
- Amazon Associates Store ID: `offerloom-21`; India tax status is complete.
- Amazon destinations are manually curated and tagged. No Amazon product API is connected, and no marketplace scraping is permitted.
- **Meesho Creator Club (affiliate)** account exists at <https://affiliate.meesho.com>. Meesho connector is **not implemented**; see planned work below.
- CJ publisher onboarding, tax and payment setup were completed. Dell Consumer – India and HP India applications were pending manual review at the last check. Do not use CJ product data or links until a relationship is Active and the applicable feed/link rights are confirmed.
- Flipkart, Myntra, AJIO and Optimise feeds are not connected.

## Amazon affiliate (implemented August 2026)

- Tagged outbound links are built server-side in `app/lib/amazon.ts` (`withAmazonAssociateTag`, `buildAmazonProductUrl`, `buildAmazonSearchUrl`).
- Tracked redirects:
  - `/go/amazon/dp/{asin}` → `https://www.amazon.in/dp/{asin}?tag=offerloom-21`
  - `/go/amazon/search?k={query}` → tagged Amazon search
  - `/go/amazon/{listingId}` → D1 `affiliate_url` with tag enforced
- Homepage category tiles and demo collection links route through `/go/amazon/search` so the tag is always applied server-side.
- Admin product form previews the tagged product URL when an Amazon.in URL is pasted (SiteStripe-equivalent without manual “Get Link”).
- **Do not scrape** Amazon category or search pages for ASINs. Bulk catalogue work uses CSV import (up to 500 rows) or future **Amazon Creators API** after eligibility (~10 qualifying sales in 30 days, per current programme guidance).
- SiteStripe in the browser is associate-only tooling; visitors never see it. OfferLoom replaces it for outbound product links when an ASIN or admin URL is known.

## Meesho affiliate (researched, not built)

- Meesho has **no public product API or affiliate feed**. Do not scrape `meesho.com` or reverse-engineer affiliate dashboard APIs.
- Valid affiliate destinations come only from the Creator Dashboard:
  - **Collection link:** `https://affiliate.meesho.com/collection/{base64-id}` (example collection id decodes to `9151525::::::normal`) — one tracked link for a product grid; share as-is on social or via a future `/go/meesho/collection/...` redirect.
  - **Single product link:** `https://meesho.onelink.me/...` (AppsFlyer deep link). Browser may show only `OK`; the full URL must be stored unchanged. Normal `meesho.com` product URLs are **not** affiliate-tracked.
- Planned connector (when requested): add `meesho` merchant row, admin paste of dashboard affiliate URLs, `/go/meesho/{listingId}` redirect, optional collection redirect, “View on Meesho” on product pages. No auto-sync from collection pages.

## Implemented product surface

- Four-slide hero: OfferLoom, Electronics, Fashion and Home.
- Original triptych artwork at `public/category-showcase-v1.png` for the three shopping departments.
- Search is positioned below the carousel controls with a verified 42px visual gap.
- Top-level departments are Electronics, Fashion and Home. Electronics expands to Mobiles, Laptops, Audio, TVs and Gaming; Home expands to Appliances.
- Owner-only D1 catalogue admin, reviewed CSV import, canonical product pages, multi-merchant comparison slots, tracked Amazon redirects and merchant fail-closed controls are implemented.
- Public business and legal pages with footer navigation: About, Contact, Privacy, Cookies, Terms, Affiliate Disclosure, Price Disclaimer, Advertising Disclosure, Merchant Checkout and Grievance Officer.
- Original buying guides for Electronics, Fashion and Home at `/guides`.
- Owner-only outbound click summary in `/admin`.
- CJ fixture CSV parser at `app/lib/cj/parse-fixture.ts` for future authorized feed work.
- Required Amazon disclosure remains in the lower affiliate notice. Do not remove it without replacing it with compliant equivalent wording.

## Validation and deployment state

- Latest local validation: `npm run build`, `npm run lint` and `npm test` all pass.
- Primary production target: Cloudflare Workers via `wrangler.toml` and `npm run deploy:full`.
- Automatic deploys: push to `main` after configuring `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub secrets.
- Legacy ChatGPT Sites project `appgprj_6a88b726e64c8191820e5ed711599290` may remain available until DNS/links move to Workers.
- Workers admin uses `/admin/login` with the `ADMIN_API_TOKEN` secret.

## Next concrete work

1. Bulk-import curated Amazon products via `/admin` CSV (up to 500 rows per file).
2. Drive qualifying Amazon sales toward **Creators API** eligibility; connect only through approved credentials stored as Wrangler secrets.
3. Monitor CJ until Dell Consumer – India or HP India becomes Active; then build CJ connector against fixtures first.
4. **Meesho connector:** implement only when explicitly requested — collection redirect, onelink product storage, admin paste/bulk import.
5. Optional: admin “paste multiple Amazon URLs” bulk box (no scraping).
6. Set `ADMIN_API_TOKEN`, Meta/Telegram secrets for social auto-posting, and GitHub deploy secrets if not already done.

## Non-negotiable rules

- Never commit passwords, OTPs, banking details, tax documents, signed account URLs, access tokens or affiliate secrets.
- Never scrape Amazon, Meesho, Flipkart, Myntra, AJIO or other merchants without written authorization.
- Visitors read cached OfferLoom data; merchant APIs belong in scheduled background synchronization, not page requests.
- Keep merchant connectors independent so one disabled or closed program cannot break OfferLoom.
