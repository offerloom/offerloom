# Browser collector

User requested a browser-backed collection workflow on 9 September 2026. It is separate from the Cloudflare website process and requires no merchant API credential. This is a technical collection mechanism, not a grant of merchant content or image rights.

## Run

Install the Chromium runtime with `npx playwright install chromium`, or use the installed Chrome with `OFFERLOOM_CHROME_CHANNEL=chrome`.

`OFFERLOOM_CHROME_CHANNEL=chrome node scripts/browser-collector.mjs scripts/collector-config.json`

The configured three product URLs are existing OfferLoom products, not copied competitor records. Edit the configuration to monitor up to 25 individual Amazon.in/AJIO product URLs. The collector reads the rendered page; selectors may need maintenance when merchant layouts change. It never bypasses CAPTCHA, login or 403 responses, never imports browser cookies, and does not use internal merchant APIs.

Outputs are ignored private files under `outputs/collector/`: `latest.json` is the latest successful observations; `status.json` records failures. Failed reads do not change previously approved data. Configured categories are provisional and need review.

## Admin and publishing

Import `latest.json` under Admin → Browser-collected products. Alternatively set `OFFERLOOM_COLLECTOR_ENDPOINT=https://offerloom.contact-offerloom.workers.dev/api/admin/collected-deals` and `OFFERLOOM_ADMIN_TOKEN` in the runner's private environment. Tokens are never sent to the browser or printed.

An owner-operated runner with existing Wrangler authentication can instead use `--d1-remote` to stage observations in the existing D1 review queue. This requires migration 0005 first. No API token needs to be copied out of Cloudflare.

Review the source product, image usage rights, category and price; write an original summary, then publish. AJIO requires a dashboard-generated deep link for that exact product; an existing validated link can be reused. Amazon destinations are generated with `offerloom-21` regardless of input tags.

Approved photo and price cards appear in the front-page product section. Prices/discounts disappear 24 hours after the observation. Refreshes produce pending observations and preserve the previous approved snapshot until reviewed. There is no automatic assertion that a product is a bestseller or the best available discount.

## Scheduling

On 11 September the current Mac's `com.offerloom.browser-collector` LaunchAgent was installed with `node scripts/install-collector-schedule.mjs`. It invokes one non-overlapping collection run every six hours and at login, staging observations using the owner's existing Wrangler authentication. Verify with `launchctl print gui/$(id -u)/com.offerloom.browser-collector`. Its first run exited 0; one Amazon draft was staged and both AJIO failures were recorded in D1. The admin panel shows recent checks and warns if checks are older than eight hours.

Logs: `outputs/collector/scheduler.log` and `scheduler-error.log`. Stop scheduling with `launchctl bootout gui/$(id -u)/com.offerloom.browser-collector`; remove only this job's plist from `~/Library/LaunchAgents/` to uninstall. Reinstall after a Node upgrade changes the executable path. The Mac must be awake and logged in; no always-on cloud availability is claimed.

Use **either** the installed LaunchAgent **or** the development `--watch` mode, not both.

Add `--watch` to repeat every `intervalHours` (default 6, minimum 1), optionally with `--d1-remote`. The process must remain running and the host must stay awake. This is a local scheduler, not a Cloudflare Cron job; Chromium does not run inside this site's Worker. Stop the process to stop collection. The runner reports success/failure counts and does not overlap its own runs. Run only one watch process per configuration.

## Verified first run

9 September 2026: Amazon Rapoo H120 returned a photo, ₹1,599 selling price and ₹3,499 MRP. Both AJIO product pages returned HTTP 403; no AJIO observation was created and no bypass attempted. Collection success is not publication or a guarantee of image rights.

11 September: in-app browser could read both AJIO products normally, including original photos and prices. The original observed images use `assets-jiocdn.ajio.com`, now accepted by the validator. Both were reviewed as assisted observations; standalone Chromium still returns 403. The backend selector now targets the product carousel (not generic thumbnail/logo elements) and includes the brand. These changes do not remove AJIO's access block.
