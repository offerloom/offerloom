# OfferLoom

**Every Deal. One Destination.**

OfferLoom is an India-first electronics product-discovery and price-comparison platform owned by Parthsheel Enterprises. This repository contains the public website and its planned catalogue-management foundation.

## Current website

- OfferLoom brand identity and social-sharing card
- Category-led landing page for Electronics, Fashion and Home
- Interactive product search, category filters and sorting
- Category-first product finder with desktop and mobile navigation
- Four-slide category-led hero for OfferLoom, electronics, fashion and home
- Original department artwork reused across the hero and category cards
- Department hierarchy that reveals detailed categories after selection
- Featured category shortcuts with approved affiliate destinations behind offer actions
- Mobiles, laptops, audio, televisions, gaming and appliances categories
- Amazon affiliate destinations tagged with `offerloom-21`
- Amazon SiteStripe links for 5G phones and wireless ANC earbuds
- Owner-only product manager at `/admin`
- D1-backed products, categories, merchant listings and outbound-click events
- Browser-collected draft queue, original product photos, dated price cards, and per-merchant collection status
- Automatic Amazon ASIN extraction and `offerloom-21` link generation
- CSV bulk import for up to 500 reviewed products per upload
- Canonical product pages with brand/model identity and multi-merchant comparison slots
- Independent merchant health controls and fail-closed affiliate redirects
- Disabled Flipkart destinations pending approved affiliate access
- Responsive desktop and mobile layouts
- Amazon affiliate disclosure and merchant checkout/returns clarification
- Public business and legal pages with footer navigation
- Original buying guides for electronics, fashion and home
- Owner-only outbound click summary in the admin
- CJ fixture parser for future authorized feed synchronization
- Cloudflare-compatible Vinext build

Public deployment: <https://offerloom.offerloom.workers.dev> (Cloudflare Workers). Legacy ChatGPT Sites URL: <https://offerloom.gdwivedi6.chatgpt.site>

## Local development

The remote Amazon browser collection schedule and product verification are documented in [docs/CLOUD_BROWSER_COLLECTOR.md](docs/CLOUD_BROWSER_COLLECTOR.md). The former six-hour Mac LaunchAgent is disabled after cloud publication verification. AJIO currently requires assisted browser review: standalone Chromium receives HTTP 403.

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Keep the Terminal process running and press `Control + C` to stop it.

Create a production build:

```bash
npm run build
```

## Main files

- `app/page.tsx` — interactive catalogue and approved affiliate destinations
- `app/globals.css` — responsive OfferLoom design system
- `app/layout.tsx` — metadata and social-sharing configuration
- `public/og.png` — OfferLoom social-sharing card
- `public/category-showcase-v1.png` — original department artwork
- `app/admin/` — owner-only manual catalogue manager
- `app/api/` — protected admin and public catalogue APIs
- `app/go/amazon/` — tracked outbound Amazon redirects
- `app/products/[slug]/` — canonical product details and merchant comparison
- `db/` and `drizzle/` — D1 schema and migrations
- `wrangler.toml` — Cloudflare Workers and D1 deployment config
- `docs/DEPLOY_WORKERS.md` — Workers deploy and GitHub Actions setup
- `.openai/hosting.json` — legacy ChatGPT Sites project reference

## Affiliate and integration status

Amazon Associates is active under Store ID `offerloom-21`, and the required India tax interview is complete. The site currently uses manually curated Amazon search destinations and does not display locally stored Amazon prices. No live shopping API is connected. Amazon Creators API access is planned after eligibility; Flipkart remains pending because public registration is unavailable. Use only approved affiliate links, feeds and images. Never add unauthorized marketplace scraping.

The homepage treats Amazon as an explicit shopping destination, keeps every outbound link tagged with `offerloom-21`, and makes clear that current prices, availability and checkout are handled by Amazon.in. Affiliate clicks or purchases do not guarantee API access; Amazon alone determines whether activity qualifies toward Creators API eligibility.

The secure catalogue milestone includes single-product entry and CSV import for up to 500 reviewed products. It extracts ASINs, creates canonical tagged destinations, rejects malformed rows, skips existing ASINs, supports publish/unpublish/archive review, and records outbound clicks. Published database products receive canonical detail pages with a multi-merchant comparison table. Merchant connectors can be paused or blocked independently; outbound redirects fail closed when a merchant is not active. Scheduled synchronization remains disabled until approved API credentials exist.

## Daily cloud browser collection

The daily workflow uses the existing browser collector on a GitHub-hosted runner dispatched by Cloudflare at 07:00 and 17:00 IST with recovery checks and GitHub backups, independent of the owner’s laptop. It discovers New Releases, Today’s Deals and bestseller candidates, validates prices, publishes up to ten newly validated products and refreshes existing active listings with `offerloom-21`. See [operation and live verification status](docs/CLOUD_BROWSER_COLLECTOR.md). Creators API access is not required by this browser workflow.

## Project handoff

Start with [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md) for the latest checkpoint, then read [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md) for business decisions, branding, architecture, account status, security notes and prioritized next tasks.

## Security

Never commit passwords, OTPs, personal access tokens, affiliate secrets, banking documents or populated `.env` files. A token shared during early setup was treated as exposed and must not be reused.
