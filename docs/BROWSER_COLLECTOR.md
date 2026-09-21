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

## Reliability behaviour (20 September 2026)

Runs on 19 September failed on roughly a third of URLs with four distinct causes; each now has its own handling.

- **`page.goto: Timeout 45000ms`**: navigation now resolves on `commit` (60 s) instead of `domcontentloaded`; the wait for `#productTitle` is the real gate. Video and font requests are blocked.
- **`net::ERR_NETWORK_CHANGED` and other network errors** (Wi-Fi/VPN switch, wake from sleep): the product is retried on a fresh page, after waiting for DNS to answer again. Up to 3 attempts, 8 s / 25 s backoff. The `wrangler d1 execute` write is retried the same way (statements are idempotent upserts).
- **"Missing product title, image or price"**: two causes fixed. (1) The variant "twister" layout (`#apex_price`, seen on B0B6HM36Z8) had no matching price selector, because its price-to-pay span carries the `a-text-price` class. (2) The price block renders after the title, so the collector now waits until a price is actually present before reading. One retry only, since this is usually a selector gap. Unavailable products (`#availability` says "Currently unavailable") are reported as such and not retried.
- **"Unexpected product redirect"**: unchanged and not retried. It means the ASIN now belongs to a different product, so remove the URL from `collector-config.json`.
- Access challenges are never retried and never bypassed.

When a product fails on a missing field, `outputs/collector/failures/<ASIN>.json` and `.png` record the page title, final URL, availability text, the first few rupee-amount elements with their ancestry, and a screenshot. The failed list (ASIN and reason) is also in `summary.json` and the sync email. Categorisation now treats an all-numeric ASIN (ISBN-10) as Books.

Tests use hand-written layout fixtures in `fixtures/amazon/` served through Playwright request interception, so the suite never contacts Amazon. They approximate observed markup; a live layout change still needs a new fixture plus a selector.

## Automated maintenance with Claude (GitHub App)

The loop: the collector runs on the owner's machine -> a product keeps failing -> `scripts/report-failures.mjs` opens a GitHub issue -> Claude (claude-code-action) opens a pull request -> CI runs the offline tests -> the owner reviews and merges -> `deploy.yml` ships the site, and (if enabled) the collector machine fast-forwards to the merged code. Claude never gets access to the Mac, Cloudflare or any secret; it works only through the GitHub App's repository permissions and never merges.

What opens an issue (consecutive 3-hour runs): a product that is gone (unavailable with no restock date, ASIN redirect, 404) or has an unrecognised page layout, after 2 runs; repeated timeouts, after 4; an access challenge or 403/429, at once. Only "gone" and "layout" issues contain `@claude`; blocked and timeout issues are for the owner and tell Claude not to act. Issues are de-duplicated against open and recently closed ones, and at most 3 open per run. Streaks live in `outputs/collector/failure-streaks.json`.

Privacy and safety: the repository is public, so issues never contain page text (it can include the delivery location); only the ASIN, the error, availability text and the price-element ancestry, sanitised, with `@` and backticks neutralised so web-page text cannot wake Claude or inject instructions. The rules Claude follows are in CLAUDE.md under "Automated maintenance rules".

One-time setup (repository admin, done by the owner):

1. Install the Claude GitHub App on `offerloom/offerloom` (https://github.com/apps/claude), or run `/install-github-app` in Claude Code.
2. Add ONE repository secret: `ANTHROPIC_API_KEY` (Claude Console) or `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`; then change the input name in `.github/workflows/claude.yml`).
3. Merge these files to `main` (issue and comment triggers only run from the default branch).
4. Create a fine-grained personal access token limited to this repository with "Issues: Read and write" and nothing else, and add it to the collector's LaunchAgent environment as `GITHUB_ISSUES_TOKEN`. Do NOT re-run `install-collector-schedule.mjs` to do this: it rewrites the whole plist and would drop the Cloudflare token and any other value that was added by hand. Use PlistBuddy on the existing plist instead:

```
read -s "T?GitHub token: "; echo
PL=~/Library/LaunchAgents/com.offerloom.browser-collector.plist
/usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:GITHUB_ISSUES_TOKEN string $T" "$PL"
launchctl bootout gui/$(id -u)/com.offerloom.browser-collector; launchctl bootstrap gui/$(id -u) "$PL"
```

5. Optional auto-update: add `OFFERLOOM_AUTO_UPDATE` = `1` the same way, and keep this checkout on `main` with no uncommitted changes. Before each run the collector then fast-forwards to `origin/main`. Merged code runs with the job's credentials, so the review before merging is the safety gate. It skips (and logs) if the checkout is not on main or is dirty, and prints a note when `package-lock.json` changed and `npm ci` is needed.

Test: open an issue by hand titled `[collector] TEST: hello`, with `@claude say hello` in the body, and check that the Claude workflow replies.

## Verified first run

9 September 2026: Amazon Rapoo H120 returned a photo, ₹1,599 selling price and ₹3,499 MRP. Both AJIO product pages returned HTTP 403; no AJIO observation was created and no bypass attempted. Collection success is not publication or a guarantee of image rights.

11 September: in-app browser could read both AJIO products normally, including original photos and prices. The original observed images use `assets-jiocdn.ajio.com`, now accepted by the validator. Both were reviewed as assisted observations; standalone Chromium still returns 403. The backend selector now targets the product carousel (not generic thumbnail/logo elements) and includes the brand. These changes do not remove AJIO's access block.
