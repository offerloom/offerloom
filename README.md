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
- `db/` and `drizzle/` — database foundation; live product schema is pending
- `.openai/hosting.json` — Sites deployment reference

## Affiliate and integration status

Amazon Associates is active under Store ID `offerloom-21`, and the required India tax interview is complete. The site currently uses manually curated Amazon search destinations and does not display locally stored Amazon prices. No live shopping API is connected. Amazon Creators API access is planned after eligibility; Flipkart remains pending because public registration is unavailable. Use only approved affiliate links, feeds and images. Never add unauthorized marketplace scraping.

The next technical milestone is a secure D1-backed admin area that accepts an Amazon product URL, extracts its ASIN, creates a canonical tagged destination, supports publish/unpublish review, and records outbound clicks. Scheduled synchronization will remain disabled until approved API credentials exist.

## Project handoff

See [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md) for business decisions, branding, architecture, account status, security notes and prioritized next tasks.

## Security

Never commit passwords, OTPs, personal access tokens, affiliate secrets, banking documents or populated `.env` files. A token shared during early setup was treated as exposed and must not be reused.
