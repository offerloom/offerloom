# OfferLoom

**Every Deal. One Destination.**

OfferLoom is an India-first electronics product-discovery and price-comparison platform owned by Parthsheel Enterprises. This repository contains the public website and its planned catalogue-management foundation.

## Current website

- OfferLoom brand identity and social-sharing card
- Electronics-focused landing page
- Interactive product search, category filters and sorting
- Mobiles, laptops, audio, televisions, gaming and appliances categories
- Amazon affiliate destinations tagged with `offerloom-21`
- Amazon SiteStripe links for 5G phones and wireless ANC earbuds
- Owner-only product manager at `/admin`
- D1-backed products, categories, merchant listings and outbound-click events
- Automatic Amazon ASIN extraction and `offerloom-21` link generation
- CSV bulk import for up to 500 reviewed products per upload
- Canonical product pages with brand/model identity and multi-merchant comparison slots
- Independent merchant health controls and fail-closed affiliate redirects
- Disabled Flipkart destinations pending approved affiliate access
- Responsive desktop and mobile layouts
- Amazon affiliate disclosure and merchant checkout/returns clarification
- Cloudflare-compatible Vinext build

Public deployment: <https://offerloom.gdwivedi6.chatgpt.site>

## Local development

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
- `app/admin/` — owner-only manual catalogue manager
- `app/api/` — protected admin and public catalogue APIs
- `app/go/amazon/` — tracked outbound Amazon redirects
- `app/products/[slug]/` — canonical product details and merchant comparison
- `db/` and `drizzle/` — D1 schema and migrations
- `.openai/hosting.json` — Sites deployment reference

## Affiliate and integration status

Amazon Associates is active under Store ID `offerloom-21`, and the required India tax interview is complete. The site currently uses manually curated Amazon search destinations and does not display locally stored Amazon prices. No live shopping API is connected. Amazon Creators API access is planned after eligibility; Flipkart remains pending because public registration is unavailable. Use only approved affiliate links, feeds and images. Never add unauthorized marketplace scraping.

The secure catalogue milestone includes single-product entry and CSV import for up to 500 reviewed products. It extracts ASINs, creates canonical tagged destinations, rejects malformed rows, skips existing ASINs, supports publish/unpublish/archive review, and records outbound clicks. Published database products receive canonical detail pages with a multi-merchant comparison table. Merchant connectors can be paused or blocked independently; outbound redirects fail closed when a merchant is not active. Scheduled synchronization remains disabled until approved API credentials exist.

## Project handoff

See [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md) for business decisions, branding, architecture, account status, security notes and prioritized next tasks.

## Security

Never commit passwords, OTPs, personal access tokens, affiliate secrets, banking documents or populated `.env` files. A token shared during early setup was treated as exposed and must not be reused.
