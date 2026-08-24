# OfferLoom Project Memory

Updated: 25 August 2026

Read this file, `README.md`, `AGENTS.md`, and `docs/PROJECT_HANDOFF.md` before changing the project.

## Current checkpoint

- OfferLoom is an India-first product-discovery and price-comparison website operated by Parthsheel Enterprises.
- Public site: <https://offerloom.gdwivedi6.chatgpt.site>
- Local repository: `/Users/gauravdwivedi/Documents/gaurav/parthsheel_enterprises/offerloom`
- Stack: Vinext, React, TypeScript, Cloudflare Worker, D1 and Drizzle.
- Amazon Associates Store ID: `offerloom-21`; India tax status is complete.
- Amazon destinations are manually curated and tagged. No Amazon product API is connected, and no marketplace scraping is permitted.
- CJ publisher onboarding, tax and payment setup were completed. Dell Consumer – India and HP India applications were pending manual review at the last check. Do not use CJ product data or links until a relationship is Active and the applicable feed/link rights are confirmed.
- Flipkart, Myntra, AJIO and Optimise feeds are not connected.

## Implemented product surface

- Four-slide hero: OfferLoom, Electronics, Fashion and Home.
- Original triptych artwork at `public/category-showcase-v1.png` for the three shopping departments.
- Search is positioned below the carousel controls with a verified 42px visual gap.
- Top-level departments are Electronics, Fashion and Home. Electronics expands to Mobiles, Laptops, Audio, TVs and Gaming; Home expands to Appliances.
- Owner-only D1 catalogue admin, reviewed CSV import, canonical product pages, multi-merchant comparison slots, tracked Amazon redirects and merchant fail-closed controls are implemented.
- Required Amazon disclosure remains in the lower affiliate notice. Do not remove it without replacing it with compliant equivalent wording.

## Validation and deployment state

- Latest local validation: `npm run build`, `npm run lint` and `npm test` all pass.
- Desktop/mobile browser checks confirmed department artwork, filtering and non-overlapping carousel/search layout.
- The current category-artwork and hierarchy update is local until explicitly approved for production deployment.
- Do not publish automatically. Ask for the exact confirmation: **Approve production deployment**.

## Next concrete work

1. Review the local homepage and obtain production-deployment approval.
2. Deploy the validated version and verify the public homepage, `/admin`, product pages and tracked redirects.
3. Monitor CJ until Dell Consumer – India or HP India becomes Active.
4. After approval, inspect the advertiser terms and obtain an authorized product feed or API credential; store credentials only as hosted secrets.
5. Build the CJ connector against fixtures first, then enable scheduled D1 synchronization only with authorized data.
6. Add original buying guides, remaining business/legal pages and an owner-only click summary.

## Non-negotiable rules

- Never commit passwords, OTPs, banking details, tax documents, signed account URLs, access tokens or affiliate secrets.
- Never scrape Amazon, Flipkart, Myntra, AJIO or other merchants without written authorization.
- Visitors read cached OfferLoom data; merchant APIs belong in scheduled background synchronization, not page requests.
- Keep merchant connectors independent so one disabled or closed program cannot break OfferLoom.
