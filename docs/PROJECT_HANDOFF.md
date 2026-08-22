# OfferLoom Project Handoff

Updated: 22 August 2026  
Business owner: Parthsheel Enterprises

## Ready-to-paste context for a new ChatGPT session

```text
I am building OfferLoom, an India-first affiliate deal aggregation and price-comparison business owned by Parthsheel Enterprises.

Brand name: OfferLoom
Brand meaning: A “loom” weaves multiple threads together; OfferLoom brings offers from multiple shopping websites together in one destination.
Tagline: Every Deal. One Destination.
Initial category: Electronics
Target audience: All age groups in India
Website language: English
Initial advertising budget: ₹0; use organic Facebook, Instagram, WhatsApp and SEO first.

The first website prototype has already been built and privately deployed.
Live review URL: https://offerloom.gdwivedi6.chatgpt.site
GitHub account: https://github.com/offerloom
Private source repository: https://github.com/offerloom/offerloom

Local project path on the original computer:
/Users/gauravdwivedi/Documents/Codex/2026-08-21/if-i-have-a-shopify-website

The prototype uses a Vinext/React/TypeScript website structure. It has an OfferLoom homepage, electronics categories, sample deal cards, comparison messaging, responsive mobile styling, affiliate disclaimers, and a branded social-sharing image. Sample products and prices are illustrative; no live affiliate API is connected yet.

Important business decision: Do not use Shopify as the main platform. OfferLoom needs custom product feeds, product matching, multiple merchant prices, scheduled synchronization, price history and outbound affiliate tracking. Shopify is designed primarily for selling owned inventory and checkout.

Recommended initial integration: Apply for Flipkart Affiliate access and use its official product/offer feeds if approved. Apply for Amazon Associates, initially curate Amazon links manually, and request Product Advertising API access after eligibility. Do not scrape marketplaces without permission. Myntra should be added later through an approved affiliate network or partnership.

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
- Local source path: `/Users/gauravdwivedi/Documents/Codex/2026-08-21/if-i-have-a-shopify-website`

The GitHub `offerloom/offerloom` repository is the preferred source for future work.

## Main source files

- `app/page.tsx` — OfferLoom homepage structure and sample deal data
- `app/globals.css` — complete responsive brand styling
- `app/layout.tsx` — metadata, fonts and social-sharing configuration
- `public/og.png` — generated OfferLoom social-sharing card
- `.openai/hosting.json` — Sites deployment project reference
- `package.json` — project scripts and dependencies
- `vite.config.ts` — Vinext and Cloudflare-compatible build setup
- `worker/index.ts` — worker entry point
- `db/` and `drizzle/` — starter database structure; no live product schema has been implemented yet

## Local development

From the existing local folder:

```bash
cd "/Users/gauravdwivedi/Documents/Codex/2026-08-21/if-i-have-a-shopify-website"
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

A new Google account for OfferLoom was created or was being finalized. The final Gmail address was not recorded in the project conversation and should be supplied in the new session.

A GitHub personal access token was pasted into the old chat and used once to create and populate the private repository. That token must be considered exposed and revoked. Never copy it into this handoff, source code or a new chat. Create a replacement only if required and keep it in a secure password manager or GitHub credential manager.

Never share or commit:

- Google or GitHub passwords
- OTP or recovery codes
- GitHub personal access tokens
- Affiliate API keys and secrets
- Meta access tokens
- Banking, PAN or identity documents
- `.env` files containing secrets

## Affiliate integration status

- Flipkart Affiliate account: Not created yet
- Flipkart API credentials: Not available
- Amazon Associates account: Not confirmed
- Amazon Product Advertising API: Not available
- Myntra integration: Not available
- Live database synchronization: Not implemented
- Product matching: Not implemented
- Affiliate click tracking: Not implemented

Recommended first partner sequence:

1. Complete the OfferLoom business email and account recovery setup.
2. Apply for Flipkart Affiliate access and verify that API credentials are currently obtainable.
3. Apply for Amazon Associates.
4. Publish original buying guides and deal content.
5. Use manual, approved affiliate links until official API access is granted.
6. Replace demonstration product data only after partner approval.

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

1. Confirm the final OfferLoom Gmail address and recovery setup.
2. Revoke the exposed GitHub token and create a secure replacement only if necessary.
3. Confirm ownership and recovery settings for the `offerloom` GitHub account.
4. Add an OfferLoom-specific README to the repository if the current README is still generic.
5. Decide whether the private preview should remain private or become publicly accessible.
6. Add real policy pages and footer navigation.
7. Implement a proper electronics product database schema.
8. Build a password-protected admin interface for manually curated deals.
9. Apply for Flipkart and Amazon affiliate programs.
10. Connect only approved feeds or APIs; do not implement unauthorized scraping.
11. Add affiliate click tracking and scheduled product updates.
12. Replace all illustrative products and prices with approved data.

## Important working principles

- Build OfferLoom as a custom comparison platform, not a Shopify store.
- Start with electronics and one approved partner.
- Keep infrastructure inexpensive during validation, but do not assume it will remain free forever.
- Preserve repository history and existing deployed functionality.
- Never claim a deal is live unless its price and availability have been refreshed.
- Clearly distinguish example data, manual deals and API-synchronized deals.
- Follow affiliate agreements, image licences, advertising disclosures and Indian consumer-protection requirements.
- Avoid fake countdown timers, misleading discounts and unauthorized scraping.
