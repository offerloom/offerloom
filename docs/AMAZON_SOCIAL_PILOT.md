# Amazon social publishing pilot

Updated: 12 September 2026

## First product draft — not published

Product: Rapoo H120 USB headset, ASIN B07PPS3ZZY. Identity matches the existing collector record and Amazon browser title. Current specifications, stock, price and discount have not been verified.

Destination: https://www.amazon.in/dp/B07PPS3ZZY?tag=offerloom-21

Facebook caption draft:

> Looking at USB headsets? Explore the Rapoo H120 on Amazon.in and check its specifications, current price and availability before buying.
>
> https://www.amazon.in/dp/B07PPS3ZZY?tag=offerloom-21
>
> #Ad — As an Amazon Associate I earn from qualifying purchases.

Use a verified licensed product asset or original editorial artwork before preparing an Instagram media post. Do not reuse the old collector price as a current deal. Instagram placement needs a usable destination strategy; do not promise a clickable feed-caption link.

## Verified setup

- Meta Graph API publishing remains connected to Page ID `1220668387806265`. The owner-supplied public follow URL `https://www.facebook.com/profile.php?id=61594517871499` resolves to an OfferLoom page in browser verification on 24 September 2026 and is used by the public site's follow links. Confirm the Graph API Page mapping before changing automated posting; do not assume the public follow page and publishing identity match.
- Instagram Business Account ID (verified): `17841432278236615`, connected to the above Page.
- META_PAGE_ACCESS_TOKEN, META_PAGE_ID and META_INSTAGRAM_USER_ID are configured as Worker secrets, generated via a non-expiring Business Portfolio System User ("OfferLoom Automation", full access to the Page, Instagram account, and the "OfferLoom Automation" Meta app).
- 13 September 2026: live end-to-end test succeeded on both platforms — Facebook post `122094426375483929`, Instagram post `18125019682634611`. Amazon CDN images are served through `/api/social-image` (a same-origin proxy) because Instagram's media-download crawler was being blocked directly on Amazon's CDN even though Facebook's crawler was not; Facebook posts also use the proxy for consistency.
- Daily auto-post automation is live via a Cloudflare Cron Trigger (`0 13 * * *`, i.e. ~18:30 IST), implemented in `app/lib/social/auto-post.ts` and wired through `worker/index.ts`'s `scheduled` handler. It picks the single highest-discount product not already posted (status `published`) in the last 30 days, tracked via `social_posts.product_id`.

## Next executable steps

1. Monitor the daily automated post for a few days to confirm it keeps succeeding without manual intervention.
2. Consider adding Telegram/WhatsApp Channel auto-posting using the same picker logic, if desired.
3. If the site's product catalogue grows to cover more categories, review whether the 30-day no-repeat window and single-post-per-day cadence still fit.
