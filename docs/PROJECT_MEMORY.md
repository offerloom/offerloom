# OfferLoom Project Memory

Updated: 20 September 2026

## Collector reliability pass — 20 September 2026

- The 19 September runs (22–27 of ~34 collected) failed for four separate reasons: `goto` timeouts, `ERR_NETWORK_CHANGED` (Mac network change/sleep), a price-layout gap, and a real ASIN redirect. Details and the fixes are in `docs/BROWSER_COLLECTOR.md` → "Reliability behaviour". Summary: commit-based navigation, retry with network wait, `#apex_price` selectors, wait-for-price, failure diagnostics in `outputs/collector/failures/`, failed list in `summary.json` and the sync email, ISBN-10 ASINs categorised as Books, D1 write retried.
- Found by inspecting B0B6HM36Z8 in a real browser: its price sits under `#apex_price` (`.apex-pricetopay-accessibility-label` "₹299.00 with 63 percent saving", MRP under `.apex-basisprice-value`). That is the likely reason it kept failing while showing a valid price on manual checks.
- Not verified against live Amazon from the cloud session (datacenter IPs are blocked and out of scope); verified with fixtures only. **First thing to do on the Mac after applying: run the collector once in the foreground, read `progress.log`, and check `outputs/collector/failures/` for anything still failing.**
- **Root cause of most timeouts: the Mac sleeps mid-run.** The 20 Sep 03:44 UTC run took 3h09m for 34 URLs; single "45 s timeouts" spanned 6–26 minutes of wall-clock time, and 8 of the 10 failures were `goto` timeouts or `ERR_NETWORK_CHANGED` (sleep/wake). `run-collector-and-notify.mjs` now spawns `caffeinate -i -m -s -w <pid>` for the life of the run, and the collector logs a NOTE when one URL takes over 3 minutes. The `keepawake` agent's `caffeinate -s` only helps on AC power; a closed lid still sleeps the Mac.
- **Verified on the Mac, 20 Sep 2026 15:05 IST scheduled run (first with the patched collector):** 33 of 34 collected in 4m55s (previous run: 24 of 34 in 3h09m), written to D1, sync email sent. B0B6HM36Z8, B09NKYWRD2 and the earlier timeouts all succeeded. The one failure, B006G832TG (Chetan Bhagat 3-book combo), is genuinely "Currently unavailable. We don't know when or if this item will be back in stock" per its failure diagnostics, so it was removed from `scripts/collector-config.json` (33 URLs now). Its existing D1 product record was not touched; its price stops displaying 24 hours after the last observation.
- **Claude GitHub App loop added (20 Sep 2026, not yet enabled):** `.github/workflows/claude.yml` (@claude responder), `.github/workflows/ci.yml` (`npm ci`, Playwright Chromium, `npm test` on every PR), `scripts/report-failures.mjs` (opens `[collector] <ASIN>: ...` issues for persistent failures, sanitised because the repo is public), opt-in `OFFERLOOM_AUTO_UPDATE`, and "Automated maintenance rules" in CLAUDE.md. Setup steps are in `docs/BROWSER_COLLECTOR.md`. The owner still has to install the GitHub App, add `ANTHROPIC_API_KEY` (or an OAuth token) and a scoped `GITHUB_ISSUES_TOKEN`, and merge to `main`. Do not re-run `install-collector-schedule.mjs` to add env vars: it rewrites the plist and drops values added by hand (Cloudflare token). `ci.yml` requires the collector and reporting tests (pass) and runs the full `npm test` as informational only (`continue-on-error`): the cloud session could not run the build (npm registry blocked), and `tests/rendered-html.test.mjs` already fails on main because it asserts homepage copy ("Tagged product link|Opens Amazon search") removed by the 13-14 Sep rework. Fix that assertion, then drop `continue-on-error`.
- Compliance boundary unchanged: the collector only refreshes URLs listed in `scripts/collector-config.json`; it does not discover products.
- Still open from 18 September: confirm auto-login and the reboot test.

## Catalogue gap-fill, dead-URL cleanup, live progress logging — 18 September 2026

- **Books/Toys gap filled**: added 2 Books ("You Can" by George Matthew Adams, ₹99; "World's Greatest Books" 4-book motivational boxset, ₹319) and 3 Toys (TEC TAVAKKAL Duck Slide Toy Set ₹297; EITHEO Geometric Angle Blocks shape sorter ₹138; Storio Blaze Storm foam blaster ₹183), taking those two categories from 1 product each to 3 and 4. Found this time by browsing Amazon.in directly in-session (owner explicitly re-authorized crossing the "no discovery browsing" compliance boundary for this one session) rather than general web search — still individual, verified-in-stock `/dp/` URLs added to `scripts/collector-config.json`, same compliant pattern as before. `BOOKS_KEYWORDS`/`TOYS_KEYWORDS` in `categorize()` were widened to also match generic "book(s)"/"toy(s)" — 2 of the 3 toy titles and 1 of the 2 book titles didn't contain the narrower existing keywords and would have silently miscategorized as Electronics otherwise.
- **Dead-URL cleanup**: a routine collector run failed on 8 of 36 URLs. Manually checked each in a browser: 6 were genuinely dead (5 "Currently unavailable" — Mamaearth sunscreen, 2x Boldfit resistance bands, 2x AmazonBasics car mounts; 1, `B0HB5JNXPX`, now redirects to a different ASIN — Amazon merged/replaced that listing) and were removed from `collector-config.json`. 2 (`B006G832TG` a Chetan Bhagat book combo, `B0B6HM36Z8` a Portronics car mount) still showed real in-stock prices on manual check despite failing in the collector run — left in place as a likely one-off render/selector miss; **if these keep failing on future runs, check whether Amazon's book-page price markup differs from the standard buy-box the collector's selectors target.**
- **Live progress logging added**: the collector previously gave zero feedback until the entire ~30-URL batch finished (several minutes). It now writes `outputs/collector/progress.log` (and mirrors to stderr) with one line per URL — index/total, "fetching", then "OK: <name> Rs.<price>" or "FAILED: <reason>" — watchable via `tail -f outputs/collector/progress.log` while a run is in progress.
- **Scheduler reliability decision**: the LaunchAgent-based schedule (`~/Library/LaunchAgents/com.offerloom.browser-collector.plist`, `RunAtLoad` + `StartCalendarInterval`, plus the `keepawake` caffeinate agent) only runs while the owner is logged into a GUI session — a full reboot with nobody logging back in silently stops it. Chose **enabling macOS automatic login** over converting to a LaunchDaemon (a LaunchDaemon needs no login at all, but this project has already hit one macOS/launchd-specific gotcha before — the TCC `Operation not permitted` issue noted elsewhere in this file — and building/debugging an untested LaunchDaemon blind carried more risk than the login-security trade-off of auto-login). **Pending owner action, to verify tomorrow: auto-login enabled in System Settings, then a real reboot test — confirm the Mac logs back in unattended, `launchctl list | grep offerloom` shows both agents loaded, and a fresh `progress.log` timestamp appears without anyone running the collector command by hand.**
- **Operational note for future sessions working on this repo from a cloud/remote environment**: a cloud Claude session cloning this repo anonymously has no GitHub push access (the org's git proxy rejects it — "not in this session's authorized repository set" — and no fix for adding a repo to that set mid-session was found). The working pattern that succeeded: prepare the change as a git commit in the cloud clone, export it with `git format-patch`, deliver the file, and have the owner run `git am <patch>` on their own Mac checkout (already authenticated) followed by the normal push/merge. Watch for a stray `.git/rebase-apply` directory from an earlier interrupted `git am` — run `git am --abort` first if a fresh `git am` reports "previous rebase directory ... still exists."
- As of this writing, unconfirmed whether the dead-URL-cleanup/progress-logging patch above and the auto-login change have actually been applied/pushed/tested — pick this up as the first thing next session.

## Homepage rework, catalogue categorization and multi-platform posting — 13 September 2026

- **Homepage layout**: removed the duplicate plain "Product Finder" list (icon-only cards with no photos, no real products) that showed under the real photo-grid "Latest product picks" section — search and category filtering now operate on the one real product grid only. Also removed the "Start with a category" section (12 generic Amazon-search tiles) since the real category tabs in "Latest product picks" (All picks / Home / Fashion / Electronics) already cover this; the `ShopCategoryGrid` component and its data were deleted as now-unused. The search bar (`.finder` section) was moved to sit directly under the hero banner rather than further down the page.
- **Hero banner is now dynamic and data-driven**: it shows a real-photo collage (up to 3 products) of the current best deals for whichever category the active slide represents, with a live "Up to X% off" headline, instead of one static stock photo. It also now only rotates through slides for categories that actually have real published products (`app/page.tsx` filters `heroCategorySlides` by `photoProducts` categories each render) — so it automatically grows from 4 to 5+ slides as more categories get real inventory, with no manual code change needed.
- **Product categorization bug fixed**: the browser collector was tagging every Amazon product as "Electronics" regardless of what it actually was. `scripts/browser-collector.mjs` now has a `categorize(merchant, name)` keyword matcher (containers/bottles/cookware → Home; bags/clothing/footwear → Fashion; sunscreen/face wash/skincare → Beauty; yoga mat/resistance band/gym → Sports; paperback/hardcover → Books; car mount/dashboard/windshield → Auto; AJIO → Fashion; else Electronics). The 5 already-published products that were wrong (Prestige cooktop, 3 MILTON kitchen items, Wildcraft backpack) were re-tagged directly in D1 to Home/Fashion. `Home` and other new category rows are created automatically in D1 as needed (`cat-<slug>`).
- **Catalogue expanded to 6 real categories (25 products)**: added real Amazon.in products (found via web search, not scraped) in Beauty (Lakme, Mamaearth), Sports (Boldfit), and Auto (Portronics car mobile holders) — Electronics, Home and Fashion already had coverage. Books and Toys were attempted but couldn't find enough real, working amazon.in `/dp/` links via search; add more collector URLs for those later if wanted. `heroCategorySlides` `filterCategory` values were updated to match real category names (Beauty, Sports, Auto, Books) so hero slides target real inventory once available, instead of a generic "All" fallback. The collector config caps at 25 URLs total, so several permanently-broken ("no single buy-box price") and redundant duplicate entries were retired to make room — check `scripts/collector-config.json` for the current active list before assuming a product isn't tracked.
- **Collector reliability**: fixed a real bug where a comma-joined CSS selector's `.first()` could land on an earlier blank placeholder element instead of the actual price, silently dropping valid prices — selectors are now tried in priority order for the first non-blank match. Added a 4–8s randomized delay between products in one collector run (a 19-in-a-row burst was triggering Amazon's soft rate-limiting, causing most products in a run to fail even though each succeeds fine in isolation). Raised the `wrangler d1 execute` timeout from 60s to 180s (was timing out as the catalogue grew). The scheduled sync interval was reduced from 6 hours to 1 hour per owner request, balanced against bot-detection risk (rejected an earlier ask for a 10-minute interval as too risky for the Associates account).
- **Multi-platform social posting is live**: every daily auto-post (Cloudflare Cron, `0 13 * * *`) now targets Facebook, Instagram, WhatsApp Channel, X and YouTube Community simultaneously. Facebook and Instagram post automatically via the Graph API (see the "Social publishing live" section below for credentials/setup). WhatsApp Channel, X and YouTube Community have **no public posting API** — for these three, the run instead generates a ready-to-paste caption (X's is shortened to fit the 280-character limit; the other two use the long-form caption) shown in `/admin` under each post's "Recent posts" entry with a **Copy caption** button (`app/admin/SocialPostsPanel.tsx`). This was a deliberate choice after the owner confirmed X's $100/month paid API tier and YouTube/WhatsApp Channel's total lack of a posting API were not worth pursuing right now.
- **Cloudflare deploy propagation anomaly**: during this session, `wrangler deploy` reported 100% successful rollout on every call, but production traffic kept serving stale code for a period of roughly 20–30 minutes across many rapid deploys (confirmed independently via two different network paths — not a local caching or DNS issue). It resolved on its own after waiting; no code change fixed it. If a future deploy "isn't showing up" despite a clean build and a successful `wrangler deploy`, wait and re-check before assuming the code is wrong — don't rapid-fire more deploys, which may have caused it in the first place.

Read this file and `README.md`/`AGENTS.md` before changing the project — `docs/PROJECT_HANDOFF.md` no longer exists.

## Social publishing live — 13 September 2026

- Amazon/AJIO auto-post to Facebook and Instagram is live and verified. See `docs/AMAZON_SOCIAL_PILOT.md` for full details.
- The correct, working Facebook Page is https://www.facebook.com/1220668387806265 (name "OfferLoom", Page ID `1220668387806265`) and the connected Instagram Business Account ID is `17841432278236615`. Two older Facebook profile.php IDs referenced in earlier notes (`61593570969974` in `app/lib/site.ts`, `61594517871499` in this file and `docs/AMAZON_SOCIAL_PILOT.md`) were **not** this Page — `app/lib/site.ts`'s `SOCIAL_LINKS.facebook.href` has been corrected to the verified URL above.
- META_PAGE_ACCESS_TOKEN, META_PAGE_ID, META_INSTAGRAM_USER_ID are set as Worker secrets (non-expiring System User token, "OfferLoom Automation" Meta app).
- A Cloudflare Cron Trigger (`0 13 * * *`) auto-picks the single best current discount not posted to either platform in the last 30 days and publishes it to both. Product images are served through `/api/social-image` (a same-origin proxy) because Instagram's crawler was being blocked directly on Amazon's CDN.

## Social publishing checkpoint — 12 September 2026 (superseded by the entry above)

- Owner now wants an Amazon social publishing pilot managed by OfferLoom backend. See `docs/AMAZON_SOCIAL_PILOT.md` for the first unpublished product draft and exact remaining setup.
- Production Worker secret-name check returned only ADMIN_API_TOKEN; Meta publishing credentials are not configured. No social post has been published or scheduled in this pilot.
- Amazon support confirms the store lacks 10 eligible separate orders in the preceding 30 days. The reply uses PA API terminology despite the Creators API question; do not claim API access has been enabled.

## Homepage design update — 11 September 2026

- Replaced the duplicated introductory blocks with a navy shopping hero above real product picks. Reuses original category artwork; category banner copy and tagged shopping links remain available with previous/next and opt-in play/pause. One main heading, responsive stacked mobile layout, and no unverified percentage discounts in the hero.
- Amazon credentials were created by the owner; a private local authentication test succeeded but the product API returned HTTP 403. No API product sync is connected yet. Never include credentials in this memory.

## Current checkpoint

- OfferLoom is an India-first product-discovery and price-comparison website operated by Parthsheel Enterprises.
- **Default development branch:** `offerloom` (tracks `origin/offerloom`). `main` remains the stable/release branch.
- Public site (Workers): <https://offerloom.contact-offerloom.workers.dev>
- Legacy ChatGPT Sites URL: <https://offerloom.gdwivedi6.chatgpt.site>
- Local repository: `/Users/gauravdwivedi/Documents/gaurav/parthsheel_enterprises/offerloom`
- Stack: Vinext, React, TypeScript, Cloudflare Worker, D1 and Drizzle.
- Amazon Associates Store ID: `offerloom-21`; India tax status is complete.
- Amazon destinations are curated and tagged. No Amazon product API is connected. On 9 September the user explicitly requested the browser collector; this request supersedes older project guidance against implementing that workflow, but does not establish merchant image licences or permit access-control bypasses.
- **Meesho Creator Club (affiliate)** account exists at <https://affiliate.meesho.com>. Meesho connector is **not implemented**; see planned work below.
- CJ publisher onboarding, tax and payment setup were completed. Dell Consumer – India and HP India applications were pending manual review at the last check. Do not use CJ product data or links until a relationship is Active and the applicable feed/link rights are confirmed.
- Flipkart, Myntra and Optimise feeds are not connected. AJIO is connected as a manually curated D1 catalogue source; the Trackier deals endpoint currently returns no records.

## AJIO affiliate status (verified September 2026)

- **11 September checkpoint:** both original AJIO product pages were readable in the in-app browser. Original product photos on `assets-jiocdn.ajio.com`, bag price ₹600 / MRP ₹1,999, and girls’ trouser price ₹270 / MRP ₹899 were observed and reviewed. Original summaries and product specs replaced the old undated bestseller/discount claims. These are assisted browser observations, not automatic synchronization.
- The standalone Chromium collector still receives HTTP 403 for both AJIO pages (including a normal headed attempt). Do not claim unattended AJIO collection is working. Future prices expire after 24 hours unless a fresh observation is reviewed. Image URLs are the originals observed on the merchant page, not synthesized or a blanket assertion of reuse rights.
- The trouser is **girls’ clothing**, not women's. On 11 September sizes 9–10Y and 11–12Y were selectable; availability is not guaranteed.

- AJIO ACE publisher account is accessible for `offerloom` through Trackier.
- Active campaign: `AJIO ACE PROGRAM(Final)`, campaign id `1`, India, sale objective.
- Approved publisher tracking link format: `https://ajiotrk.vibconnect.in/click?campaign_id=1&pub_id=1072`.
- AJIO supports publisher-generated deep links by enabling **Add DeepLink** and supplying an AJIO product URL. Product URLs must be generated in the ACE dashboard; do not invent or scrape tracking parameters.
- Campaign payout shown in the dashboard: 12% for new users and 6% for repeat users. Employee coupons, silver jewellery and fine jewellery are excluded from payout. These are commission rates, not customer discounts.
- Trackier Publisher API access is available from Integration → API. The documented Deals endpoint is `GET https://api.trackier.com/v2/publishers/deals` with `X-Api-Key` authentication.
- A live read-only check returned zero deals (`deals: []`) on 8 September 2026. The response included pagination fields, but no active AJIO deal records were available.
- Do not store the AJIO API key in source, screenshots, chat, or committed files. The key was exposed in screenshots and chat during setup and must be regenerated by the AJIO administrator before production use. Local testing used a private temporary file outside the repository.
- AJIO shopping pages are accessible in the browser, but product data is not an authorized feed. Product selection is manual and must be reviewed before publishing.
- Initial manually validated candidates from AJIO's “Min 70 Percent Off” collection:
  - Altheory by AZORTE Rigid Crossbody Bag, product `442710962_offwhite`, displayed ₹600 vs MRP ₹1,999 (70% off), AJIO label `BESTSELLER`, 4.3/5 from 8 ratings, free size.
  - Outryt by AZORTE Rib Flared Trouser, product `443118370_jetblack`, displayed ₹270 vs MRP ₹899 (70% off), AJIO label `BESTSELLER`, 4.1/5 from 14 ratings, only size 9–10Y selectable.
- Both products showed conditional `NEW30` prices (₹420 and ₹189 respectively). Do not present these as guaranteed prices; retain the coupon terms and eligibility caveat.
- AJIO integration must remain independent from Amazon. A disabled or unavailable AJIO feed must not break Amazon listings.
- Migration `drizzle/0004_ajio_deals.sql` adds the active AJIO merchant and publishes both validated listings in D1. Public `/api/products` returns Amazon and AJIO listings, and `/go/ajio/{listingId}` validates and records tracked outbound clicks before redirecting.
- AJIO records are currently surfaced in the homepage product finder and canonical product pages. The API uses `Cache-Control: no-store` and the homepage fetches with `cache: "no-store"` so newly published records appear without stale catalogue caching.

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
- Owner-only D1 catalogue admin, reviewed CSV import, canonical product pages, multi-merchant comparison slots, tracked Amazon and AJIO redirects and merchant fail-closed controls are implemented.
- Public business and legal pages with footer navigation: About, Contact, Privacy, Cookies, Terms, Affiliate Disclosure, Price Disclaimer, Advertising Disclosure, Merchant Checkout and Grievance Officer.
- Original buying guides for Electronics, Fashion and Home at `/guides`.
- Owner-only outbound click summary in `/admin`.
- CJ fixture CSV parser at `app/lib/cj/parse-fixture.ts` for future authorized feed work.
- Required Amazon disclosure remains in the lower affiliate notice. Do not remove it without replacing it with compliant equivalent wording.

## Validation and deployment state

- Deployed 11 September 2026 to `https://offerloom.contact-offerloom.workers.dev`, version `d8ba7e0b-c20b-4cd2-99d8-aa5efaf8bb4a`. Live verification confirmed both AJIO product pages and original CDN images return 200, public catalogue contains the reviewed ₹600 bag and ₹270 girls’ trousers, and both outbound routes return 302 to `ajiotrk.vibconnect.in`. The same reviewed records are saved in local D1. Prices stop displaying after 24 hours without a fresh approved observation; unattended AJIO collection still returns 403.
- Migration `0005_redundant_marvel_zombies.sql` adds the collector review queue and has been applied remotely. The browser collector and admin review routes are implemented. See `docs/BROWSER_COLLECTOR.md` for current operation; verify final deployment status rather than relying on older version IDs.
- 11 September: build and lint pass (image optimization warnings only); all 21 tests pass. The rendered-output test now uses the current project memory because the handoff file was already deleted in the working tree. That unrelated deletion remains preserved.
- Fixed duplicate DB binding in generated Vite/Wrangler configuration; local development now uses the existing Wrangler binding rather than adding a Sites placeholder with the same name.
- `com.offerloom.browser-collector` LaunchAgent is installed for the current macOS user and runs once every six hours, with RunAtLoad. First run exited 0 and staged one Amazon observation, logging two AJIO 403 failures. This schedule survives the chat but requires the user to remain logged in and the Mac awake; it is not a cloud scheduler.
- Recent per-merchant collection failures are visible in admin. A check older than eight hours is labelled stale rather than shown as running.
- Primary production target: Cloudflare Workers via `wrangler.toml` and `npm run deploy:full`.
- Automatic deploys: push to `main` after configuring `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub secrets.
- Legacy ChatGPT Sites project `appgprj_6a88b726e64c8191820e5ed711599290` may remain available until DNS/links move to Workers.
- Workers admin uses `/admin/login` with the `ADMIN_API_TOKEN` secret.

## Next concrete work

- User wants actual photo/price cards first, not category shortcuts. Homepage now renders records with original photos in the leading section; canonical product pages also show those photos and dated prices. Unpictured records remain in the general catalogue. Do not treat browser-assisted capture as a working unattended AJIO feed.

0. **Verify the 18 September changes actually landed and work**: confirm the dead-URL-cleanup/progress-logging patch was applied and pushed, confirm auto-login is enabled, and do the reboot test (Mac logs back in unattended → LaunchAgent `RunAtLoad` fires → fresh `progress.log` appears with no manual run). If `B006G832TG`/`B0B6HM36Z8` still fail on a clean run, investigate the book-page price-selector gap noted above.
1. Bulk-import curated Amazon products via `/admin` CSV (up to 500 rows per file).
2. Drive qualifying Amazon sales toward **Creators API** eligibility; connect only through approved credentials stored as Wrangler secrets.
3. Monitor CJ until Dell Consumer – India or HP India becomes Active; then build CJ connector against fixtures first.
4. **Meesho connector:** implement only when explicitly requested — collection redirect, onelink product storage, admin paste/bulk import.
5. Optional: admin “paste multiple Amazon URLs” bulk box (no scraping).
6. ~~Set `ADMIN_API_TOKEN`, Meta secrets for social auto-posting~~ — done 13 September 2026; see "Social publishing live" above. Telegram secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`) and GitHub deploy secrets are still not confirmed set.

## Non-negotiable rules

- Never commit passwords, OTPs, banking details, tax documents, signed account URLs, access tokens or affiliate secrets.
- Never scrape Amazon, Meesho, Flipkart, Myntra, AJIO or other merchants without written authorization.
- Visitors read cached OfferLoom data; merchant APIs belong in scheduled background synchronization, not page requests.
- Keep merchant connectors independent so one disabled or closed program cannot break OfferLoom.
