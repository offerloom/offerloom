# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev              # vinext dev server, http://localhost:3000
npm run build             # production build (vinext build)
npm test                  # npm run build && node --test tests/*.test.mjs
node --test tests/social-compose.test.mjs   # run a single test file
npm run lint               # eslint .
npm run deploy             # build + wrangler deploy (normally done via CI, see below)
npm run deploy:migrate      # apply D1 migrations to the remote database
npx wrangler d1 execute offerloom --remote --command "SELECT ..."   # query prod D1 directly
```

Requires Node.js `>=22.13.0`. The framework is **vinext** (a Vite-based Next.js-compatible runtime targeting Cloudflare Workers) — `next` itself is not used; `vinext dev`/`build`/`start` stand in for the `next` CLI.

## Branches and deployment

- Day-to-day work happens on the **`offerloom`** branch, not `main`. GitHub Actions only deploys on push to **`main`**, so `offerloom` can silently drift many commits ahead of what's actually live. Before assuming a change is deployed, check `git log --oneline main..offerloom`, then merge `offerloom` into `main` and push `main` to ship. Watch the run with `gh run watch <run-id> --exit-status` — a merge can surface build breaks that were never caught on `offerloom` alone.
- The "Deploy OfferLoom to Cloudflare Workers" workflow builds, applies D1 migrations, then `wrangler deploy`s. It needs `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` repo secrets.
- Live site: `https://offerloom.contact-offerloom.workers.dev`.

## Architecture

**Runtime**: Next.js App Router conventions (`app/` directory, route handlers, `generateMetadata`) compiled by vinext onto a single Cloudflare Worker (`worker/index.ts`), which also handles image optimization and the `scheduled()` cron handler. D1 (`env.DB`, binding declared in `wrangler.toml`) is the only datastore; schema lives in `db/schema.ts` with Drizzle migrations in `drizzle/`.

**Product data model**: `categories` → `products` → `merchant_listings` (one row per merchant per product, holds the affiliate URL and status) → `collected_deals` (raw + `approved_payload` scraped price/stock data, keyed `{merchant}-{merchantProductId}`, joined back to a listing via `cd.id = ml.merchant || '-' || ml.merchant_product_id`). `publicOffer()` (`app/lib/public-offer.ts`) is the single place that turns an `approved_payload` JSON blob into a safe-to-render price/MRP/checkedAt struct — reuse it rather than parsing `approved_payload` inline. Outbound affiliate clicks are logged to `outbound_clicks` by the `/go/{merchant}/...` redirect routes, which fail closed (404) if the merchant/listing/product isn't active+published.

**Product sync runs locally on the owner's Mac, not in CI.** `scripts/browser-collector.mjs` drives Playwright/real Chrome against a fixed, manually-curated list of product URLs in `scripts/collector-config.json` (no cap on count) — it only ever refreshes/imports *known* URLs, it never crawls Amazon's own category/search/bestseller pages to discover new ones (see Compliance below). It's scheduled via two macOS LaunchAgents installed by `scripts/install-collector-schedule.mjs`: `com.offerloom.browser-collector` (runs `scripts/run-collector-and-notify.mjs`, which does the collector run then always emails a summary via `scripts/send-sync-email.mjs`) and `com.offerloom.keepawake` (`caffeinate -s`, AC-power only, so scheduled runs aren't skipped by sleep). Two non-obvious gotchas if this breaks again: (1) launchd spawning `/bin/bash` under a path inside `~/Documents/...` fails under macOS's TCC privacy protection ("Operation not permitted" on getcwd) — that's why the LaunchAgent invokes `node` directly on a single `.mjs` orchestrator instead of a bash wrapper; (2) `StartInterval` (elapsed-time scheduling) is unreliable for a LaunchAgent that stays loaded for many hours — it's configured with `StartCalendarInterval` (fixed times) instead. The collector authenticates to Cloudflare via a dedicated `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` pair baked into the LaunchAgent's environment, deliberately *not* the shared interactive `wrangler login` session (which lives in one file for the whole machine and gets silently swapped if any other project on the same Mac runs `wrangler login`).

`/catalog.csv` (`app/catalog.csv/route.ts`) serves the same published-product data as a Meta Commerce Manager feed (registered there as a daily scheduled "Replace" feed) — kept independent of the collector's own D1 writes.

**Social posting** (`app/lib/social/`): `runAutoSocialPost` (`auto-post.ts`) runs on a Cloudflare Cron Trigger (`wrangler.toml` `[triggers].crons`) fully independent of the product sync — approving/refreshing a deal does not itself trigger a post. Each run picks the single best-discount published product not posted in the last 30 days and calls `createSocialPost` with all platforms at once (`facebook`, `instagram`, `whatsapp_channel`, `x`, `youtube_community`). Only Facebook and Instagram (and Telegram) actually call a real API (`publish.ts`); WhatsApp Channel, X and YouTube Community have no public posting API and come back `status: "manual"` with a ready-to-paste caption, surfaced in `/admin`'s `SocialPostsPanel.tsx`. `service.ts` enforces a 2-minute cooldown (`META_COOLDOWN_MS`) shared across the cron, the admin "Publish Now" button, and the scheduled-post drain, before allowing another real Facebook/Instagram Graph API call — Meta previously rate-limited/restricted this app after rapid manual retries during debugging looked like abuse; don't bypass this cooldown by calling `graph.facebook.com` directly. Facebook posts use `/feed` with a `link` param (not `/photos`) so the product link renders as a clickable card — Instagram captions are never clickable on any account, that's a platform limitation, not a bug.

**Compliance boundary (do not cross without the owner explicitly re-authorizing it)**: never scrape Amazon/AJIO/any marketplace's category, search, or bestseller pages to discover products — only visit individual, already-known product URLs. Growing the catalog requires either the owner supplying specific product links, the CSV bulk importer (`/admin`, `app/lib/csv.ts`, up to 500 rows — note it does *not* fetch a live price/photo, so a product added this way won't appear on the homepage grid until its URL is also added to the collector), or eventual Amazon Creators API access (blocked as of this writing: Amazon requires ~10 qualifying orders in a rolling 30-day window). Instagram/Facebook "Shops" (native clickable product tagging) is unavailable for businesses in India — a Meta regional restriction discovered directly in Commerce Manager, not fixable from this repo.
