# OfferLoom

**Every Deal. One Destination.**

OfferLoom is an India-first electronics deal-discovery and price-comparison platform owned by Parthsheel Enterprises. This repository contains the first responsive website prototype. Product names, prices and retailer labels are illustrative until approved affiliate feeds are connected.

## Current prototype

- OfferLoom brand identity and social-sharing card
- Electronics-focused landing page
- Product search presentation
- Mobiles, laptops, audio, televisions, gaming and appliances categories
- Sample Amazon and Flipkart deal cards
- Responsive desktop and mobile layouts
- Price and affiliate disclaimers
- Cloudflare-compatible Vinext build

Private review deployment: <https://offerloom.gdwivedi6.chatgpt.site>

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

- `app/page.tsx` — homepage structure and demonstration deals
- `app/globals.css` — responsive OfferLoom design system
- `app/layout.tsx` — metadata and social-sharing configuration
- `public/og.png` — OfferLoom social-sharing card
- `db/` and `drizzle/` — database foundation; live product schema is pending
- `.openai/hosting.json` — Sites deployment reference

## Integration status

No live shopping partner API is connected. The planned first integrations are Flipkart Affiliate, subject to approval, followed by Amazon Associates and Product Advertising API eligibility. Use only approved affiliate links, feeds and images. Do not add unauthorized marketplace scraping.

## Project handoff

See [`docs/PROJECT_HANDOFF.md`](docs/PROJECT_HANDOFF.md) for business decisions, branding, architecture, account status, security notes and prioritized next tasks.

## Security

Never commit passwords, OTPs, personal access tokens, affiliate secrets, banking documents or populated `.env` files. A token shared during early setup was treated as exposed and must not be reused.
