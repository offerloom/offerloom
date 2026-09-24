# OfferLoom Project Handoff

Updated: 25 August 2026
Business owner: Parthsheel Enterprises

## Ready-to-paste context for a new ChatGPT session

```text
I am building OfferLoom, an India-first affiliate deal aggregation and price-comparison business owned by Parthsheel Enterprises.

Brand name: OfferLoom
Brand meaning: A “loom” weaves multiple threads together; OfferLoom brings offers from multiple shopping websites together in one destination.
Tagline: Every Deal. One Destination.
Top-level categories: Electronics, Fashion and Home
Target audience: All age groups in India
Website language: English
Initial advertising budget: ₹0; use organic Facebook, Instagram, WhatsApp and SEO first.

The first shopping website has been built and publicly deployed.
Public URL: https://offerloom.gdwivedi6.chatgpt.site
GitHub account: https://github.com/offerloom
Private source repository: https://github.com/offerloom/offerloom

Local project path on the original computer:
/Users/gauravdwivedi/Documents/gaurav/parthsheel_enterprises/offerloom

The site uses a Vinext/React/TypeScript structure. It has a four-slide category-led hero, original department artwork, interactive search, Electronics/Fashion/Home navigation, curated product groups, approved Amazon affiliate destinations, responsive styling, the required Amazon disclosure, and a branded social-sharing image. A D1-backed owner admin can add Amazon product URLs, generate canonical tagged links, publish catalogue records and track outbound clicks. Amazon prices are not stored locally; visitors confirm current prices and availability on Amazon.in. No live affiliate API is connected yet.

Important business decision: Do not use Shopify as the main platform. OfferLoom needs custom product feeds, product matching, multiple merchant prices, scheduled synchronization, price history and outbound affiliate tracking. Shopify is designed primarily for selling owned inventory and checkout.

Amazon Associates registration is complete with Store ID `offerloom-21`, and India tax status is complete. Curate Amazon links manually until Creators API eligibility is reached. Flipkart public registration currently redirects to its existing-affiliate login, so keep Flipkart disabled until approved access is available. Do not scrape marketplaces without permission.

Continue from the existing GitHub source. Preserve the current design and repository history. Never commit passwords, API tokens, affiliate secrets or OTPs. Before making changes, inspect the repository and current deployment. Help me complete the project step by step, beginning with the tasks listed in the handoff.
```

## Business concept

OfferLoom is an affiliate deal-discovery and price-comparison website. It will collect approved product and offer data from participating shopping partners, organize it into categories, compare prices and send users to the merchant through tracked affiliate links. The merchant handles checkout, payment, shipping, cancellations and returns.

Long-term categories may include:

- Electronics
- Fashion
- Groceries
- Beauty
- Home and kitchen
- Travel
- Bank and card offers

## Confirmed branding

- Consumer brand: OfferLoom
- Legal owner: Parthsheel Enterprises
- Tagline: Every Deal. One Destination.
- Alternative marketing line: Compare More. Spend Less.
- Brand colours:
  - Deep navy: `#111827`
  - Electric indigo: `#5B4CFF`
  - Coral-orange: `#FF5A36`
  - Emerald green: `#10A56A`
  - Soft background: `#F7F8FC`
  - White: `#FFFFFF`
- Logo direction: A rounded OfferLoom “O” mark paired with the wordmark.

SaveNexa was considered first but rejected after screening found an existing “Nexa” price-comparison and cashback product in the same market.

## Completed website work

The current prototype includes:

- Branded navigation and OfferLoom logo treatment
- Hero section with the confirmed tagline
- Electronics-focused product search design
- Category panels for mobiles, laptops, audio, televisions, gaming and appliances
- Category-first catalogue navigation with result counts, desktop filters and compact mobile filters
- Four-slide homepage hero promoting OfferLoom, electronics, fashion and home categories
- Generic category and “View current offers” actions; merchant names appear only where destination clarity requires them
- Fashion category foundation alongside the original electronics catalogue
- Three top-level shopping departments: Electronics, Fashion and Home
- Electronics subcategories revealed after selection: Mobiles, Laptops, Audio, TVs and Gaming
- Home subcategory revealed after selection: Appliances
- Original category triptych artwork at `public/category-showcase-v1.png`
- Search placed below carousel controls so slide dots remain visible
- Example deal cards for Amazon and Flipkart
- Price, previous price and discount presentation
- “Verified offers,” refresh and no-extra-cost trust messaging
- “How it works” explanation
- Price and availability disclaimer
- Responsive desktop, tablet and mobile layouts
- Page metadata for search and social sharing
- A branded Open Graph/social-sharing image at `public/og.png`
- Private hosted preview
- GitHub source repository

The current prices, retailer labels and products are demonstration content only. No merchant API or real-time database is connected.

## Source and deployment

- Private hosted prototype: <https://offerloom.gdwivedi6.chatgpt.site>
- GitHub profile: <https://github.com/offerloom>
- Private GitHub repository: <https://github.com/offerloom/offerloom>
- Original Parthsheel repository also contains a copy under `website/offerloom/`: <https://github.com/parthsheelenterprises/parthsheelenterprises/tree/main/website/offerloom>
- Local source path: `/Users/gauravdwivedi/Documents/gaurav/parthsheel_enterprises/offerloom`

The GitHub `offerloom/offerloom` repository is the preferred source for future work.

## Main source files

- `app/page.tsx` — OfferLoom homepage structure and sample deal data
- `app/globals.css` — complete responsive brand styling
- `app/layout.tsx` — metadata, fonts and social-sharing configuration
- `public/og.png` — generated OfferLoom social-sharing card
- `public/category-showcase-v1.png` — original Electronics/Fashion/Home artwork
- `.openai/hosting.json` — Sites deployment project reference
- `package.json` — project scripts and dependencies
- `vite.config.ts` — Vinext and Cloudflare-compatible build setup
- `worker/index.ts` — worker entry point
- `app/admin/` — owner-only product manager
- `app/api/admin/products/route.ts` — protected catalogue management API
- `app/api/products/route.ts` — public published-product API
- `app/go/amazon/[listingId]/route.ts` — click tracking and Amazon redirect
- `db/` and `drizzle/` — D1 catalogue schema and migration

## Local development

From the existing local folder:

```bash
cd "/Users/gauravdwivedi/Documents/gaurav/parthsheel_enterprises/offerloom"
npm install
npm run dev
```

Open `http://localhost:3000` in a browser. Keep the Terminal process running. Press `Control + C` to stop it.

From a fresh computer:

```bash
git clone https://github.com/offerloom/offerloom.git
cd offerloom
npm install
npm run dev
```

Because the repository is private, the computer must be authenticated with the OfferLoom GitHub account.

Production build:

```bash
npm run build
```

## Accounts and security

OfferLoom business email: `contact.offerloom@gmail.com`. Keep its recovery settings current and never publish authentication or recovery details.

A GitHub personal access token was pasted into the old chat and used once to create and populate the private repository. That token must be considered exposed and revoked. Never copy it into this handoff, source code or a new chat. Create a replacement only if required and keep it in a secure password manager or GitHub credential manager.

A proposed Amazon password was visible in a setup screenshot. It must be considered exposed and never reused. Amazon passwords, OTPs, signed tax-interview URLs and account identifiers must not be shared in chats, screenshots or source code.

Never share or commit:

- Google or GitHub passwords
- OTP or recovery codes
- GitHub personal access tokens
- Affiliate API keys and secrets
- Meta access tokens
- Banking, PAN or identity documents
- `.env` files containing secrets

## Affiliate integration status

- Public OfferLoom deployment: Active
- Amazon Associates account: Active
- Amazon Store ID: `offerloom-21`
- Amazon India tax interview: Completed
- Amazon affiliate disclosure: Published
- Amazon manual affiliate destinations: Active
- Amazon tagged redirect routes (`/go/amazon/dp/{asin}`, `/go/amazon/search`, `/go/amazon/{listingId}`): Implemented
- Amazon SiteStripe: Not required for OfferLoom outbound links when ASIN or admin URL is known
- Amazon Creators API: Not eligible/connected yet
- Meesho Creator Club account: Active (affiliate.meesho.com)
- Meesho affiliate collection links: Available from dashboard; not wired into OfferLoom yet
- Meesho product links (`meesho.onelink.me`): Must be copied from dashboard; normal meesho.com URLs are not tracked
- Meesho connector / redirects: Not implemented (documented plan only)
- Meesho product API or feed: Not available; no scraping
- CJ publisher account: Onboarding, tax and payment setup completed
- CJ Dell Consumer – India application: Pending manual review at last check
- CJ HP India application: Pending manual review at last check
- CJ product feed/API: Not authorized or connected yet
- Flipkart Affiliate account: Not available; new registration route currently returns to existing-affiliate login
- Flipkart API credentials: Not available
- Myntra integration: Not available
- D1 catalogue and manual admin: Implemented
- CSV bulk import (maximum 500 reviewed rows): Implemented
- Canonical product pages and multi-merchant comparison layout: Implemented
- Brand/model fields for future cross-merchant matching: Implemented
- Merchant health records and emergency connector controls: Implemented
- Synchronization-run schema and fail-closed merchant redirects: Implemented
- Automatic ASIN extraction/tagged-link generation: Implemented
- Outbound affiliate click tracking: Implemented
- Live database synchronization: Not implemented; intentionally waiting for an approved API
- Product matching: Not implemented
- Affiliate click tracking: Implemented for managed Amazon redirect records

Current partner sequence:

1. Publish original buying guides and useful electronics content.
2. Use approved manual Amazon links until Creators API access is granted.
3. Use the secure product admin workflow and review outbound click data operationally.
4. Reach Amazon API eligibility through legitimate qualifying sales.
5. Connect Amazon only through the approved Creators API.
6. Revisit Flipkart when new affiliate enrollment is available.

## Planned technical architecture

The initial low-cost plan is:

- Frontend: React/Vinext or compatible modern React stack
- Hosting/CDN: current Sites/Cloudflare-compatible deployment
- Database: Cloudflare D1 for the initial product catalogue
- Scheduled synchronization: background cron jobs
- Search: database search initially; dedicated search service after growth
- Images: approved merchant image URLs only
- Analytics: privacy-compliant web analytics
- Meta measurement: Meta Pixel initially, Conversions API when useful

### Admin and catalogue management

The first owner-only D1 admin slice is implemented for products, categories, Amazon listings, editorial summaries and publish/review status. Pasting an Amazon product URL now:

1. Validates that the destination belongs to `amazon.in`.
2. Extracts the ASIN from supported `/dp/` or `/gp/aw/d/` formats.
3. Removes temporary browsing and recommendation parameters.
4. Generates a canonical destination tagged with `offerloom-21`.
5. Stores the source, review state and last-checked timestamp.
6. Keeps price display as “Check price on Amazon” until approved API data is available.

Public merchant clicks use `/go/amazon/{listingId}` or `/go/amazon/dp/{asin}` or `/go/amazon/search?k=...`, which record clicks (where a D1 listing exists) before sending the visitor to the approved Amazon.in destination with `tag=offerloom-21`. Meesho will use dashboard-supplied affiliate URLs only; no ASIN-style auto-tagging.

### Scheduled synchronization

Use Cloudflare Cron Triggers only after an approved merchant API or feed is connected. A background job should fetch authorized data, validate it, update D1, record synchronization errors and expire stale offers. Visitors must read cached D1 data; page requests must not wait for merchant APIs. A cron job must never scrape Amazon, Flipkart or another marketplace.

Initial infrastructure:

- Sites/Cloudflare Worker for the public website and server routes
- Cloudflare D1 for catalogue, listings, review state, sync history and click events
- Owner-only authentication for `/admin`
- Hosted secrets for API credentials; never commit them
- Cron Triggers for approved background synchronization
- Merchant-hosted approved images initially; R2 only when storage rights permit it

Performance rule: Visitors should read cached product data from OfferLoom’s database. The website should not wait for Amazon or Flipkart APIs during a page request.

```text
Approved partner feed/API
        ↓
Scheduled background synchronization
        ↓
OfferLoom product database
        ↓
Cached category and product pages
        ↓
Visitor clicks an affiliate link to the merchant
```

## Proposed product database entities

The next implementation should design these records:

- Canonical products
- Product categories and brands
- Merchant partners
- Merchant product listings
- Current prices and availability
- Price history
- Deals and coupon codes
- Bank/card offers
- Affiliate URLs
- Feed synchronization runs and errors
- Outbound click events
- Admin users and deal-review status

Products from different stores should be matched using brand, model number, GTIN/EAN/UPC where available, normalized title and key specifications.

## Required policy pages

Before a public commercial launch, add:

- About Us
- Contact Us
- Privacy Policy
- Cookie Policy
- Terms and Conditions
- Affiliate Disclosure
- Price and Availability Disclaimer
- Advertising Disclosure
- Merchant checkout/returns clarification
- Grievance/contact information as applicable

The site must explain that prices can change after a visitor leaves OfferLoom and that OfferLoom may earn a commission from qualifying purchases.

## Facebook and Instagram plan

Initial budget is ₹0, so begin organically:

- Create matching OfferLoom Facebook and Instagram business profiles
- Publish daily deal posts and short comparison videos
- Create WhatsApp and Telegram deal channels
- Add shareable deal pages
- Install Meta Pixel after privacy/cookie handling is ready
- Measure `PageView`, `ViewContent`, `Search`, `ClickDeal`, `OutboundClick` and `Subscribe`

Because checkout happens on the merchant website, OfferLoom may not receive complete purchase-conversion information. Initially optimize marketing around landing-page visits, subscriptions and outbound deal clicks.

## Immediate next tasks

1. Monitor twice-daily hosted product collection in GitHub Actions; investigate failed or missed publication windows.
2. Continue curating approved products and check public listing freshness.
3. Apply for Amazon Creators API access after eligibility requirements are met; the current browser workflow does not depend on it.
4. Monitor CJ until Dell Consumer – India or HP India becomes Active; use no CJ data before approval.
5. After advertiser approval, confirm feed/link rights and obtain authorized credentials without committing them.
6. Build the CJ feed connector sync job against fixtures, then enable D1 synchronization only for authorized data.
7. Apply for Amazon Creators API access after eligibility requirements are met.
8. Monitor Flipkart for legitimate new-affiliate enrollment; do not bypass its login flow.

## Important working principles

- Build OfferLoom as a custom comparison platform, not a Shopify store.
- Start with electronics and one approved partner.
- Keep infrastructure inexpensive during validation, but do not assume it will remain free forever.
- Preserve repository history and existing deployed functionality.
- Never claim a deal is live unless its price and availability have been refreshed.
- Clearly distinguish example data, manual deals and API-synchronized deals.
- Follow affiliate agreements, image licences, advertising disclosures and Indian consumer-protection requirements.
- Avoid fake countdown timers, misleading discounts and unauthorized scraping.

## Daily browser collection — 24 September 2026

- `scripts/cloud-browser-collector.mjs` discovers Amazon.in New Releases, Today’s Deals and six bestseller categories, then validates product observations before D1 publication. New additions are capped at ten per daily run; affiliate destinations use `offerloom-21`. No Creators API access or laptop uptime is required.
- A separate Cloudflare Worker, `offerloom-collector-scheduler`, dispatches the GitHub workflow at 07:00 and 17:00 IST. GitHub native schedules provide 08:00 and 18:00 backups. Cloudflare's free account cap prevented installing additional recovery cron triggers; GitHub backups cover those recovery events. GitHub queueing and product validation affect completion time.
- Worker source/config: `worker/collector-scheduler/`; automatic deployment: `.github/workflows/deploy-collector-scheduler.yml`. GitHub credential is stored in Cloudflare as `GITHUB_ACTIONS_TOKEN` with owner approval; never retrieve it into documentation or logs.
- Operation, manual probe/force options, daily deduplication and run verification: [Cloud browser collector](CLOUD_BROWSER_COLLECTOR.md). Existing Mac collection and disabled API preparation are separate workflows.
- PR #5 (`748f714`) adds New Releases discovery and the three horizontally scrolling homepage shelves; it also shortens/deduplicates clickable hero banners and replaces homepage WhatsApp links with Facebook. Hosted probe and site deployment passed. Follow-up commit `094972d` reduced Cloudflare triggers to two after free-plan cron quota rejection; scheduler deployment passed. Forced full run `36006003741` added 10 products and refreshed 78, with all three shelves now populated. Live catalogue: 91 products. PR #6 (`a8e43fe`) corrected homepage freshness copy and passed CI; the current version is deployed.

## Homepage browse and social updates — 24 September 2026

- Product shelf actions now say “View all” and open a collection-filtered product grid for New Releases, Bestsellers, or Today’s Deals. The listing includes all matching published products, not only the homepage rail subset.
- Added an AJIO Fashion Deals shelf and `/deals?merchant=ajio` listing. It surfaces the two existing manually reviewed AJIO catalogue products and keeps their approved ACE deep links behind `/go/ajio/{listingId}`. The campaign email provided sale terms and creative artwork but no individual product pages; do not infer product listings or affiliate destinations from it.
- Removed Instagram, Telegram, YouTube and X links from the site header, footer and deal-alert actions. Facebook is the only public social link, using the owner-supplied OfferLoom Page URL `https://www.facebook.com/profile.php?id=61594517871499`, verified in browser.
