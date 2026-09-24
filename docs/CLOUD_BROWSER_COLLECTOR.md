# Cloud browser collector

The owner requested the existing browser collection method on 23 September 2026, rather than waiting for Creators API eligibility. This implementation reuses `collect()` from `scripts/browser-collector.mjs`: public product page → validated title/image/price → D1 catalogue → affiliate redirect with `offerloom-21`.

## Execution

`.github/workflows/cloud-collector.yml` runs on a GitHub-hosted Ubuntu runner, independent of the owner's laptop. The separate `offerloom-collector-scheduler` Cloudflare Worker dispatches it at 07:00 and 17:00 IST. Cloudflare's free account cron limit prevented attaching extra recovery triggers; GitHub's native cron provides 08:00 and 18:00 IST backups when the Cloudflare dispatch is missed or fails. Runner queueing and collection still take time; trigger times are targets, not guaranteed publication times. Publication requires the workflow on the default branch and repository variable `CLOUD_COLLECTOR_ENABLED=true`. Existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets provide D1 access. It does not need Creators API credentials, Amazon login cookies or a browser extension.

The `--probe` command tests Today’s Deals, New Releases, one bestseller category and a product without D1 access or writes. Collector branch pushes run this probe. Scheduled/publish runs examine Today’s Deals, Amazon New Releases and six bestseller categories, validate up to 40 new candidates (eight each from Today’s Deals and New Releases, four per bestseller category), select at most ten with an observed discount of at least 10%, and refresh up to 100 existing active products. Up to three new-product slots are reserved for each source when qualifying observations are available; remaining slots go to the best observed discounts. Verified source labels power the three homepage shelves. An item appearing in a bestseller category is a discovery candidate; it is not advertised as a verified global bestseller. New eligible deals may number zero.

Paused/archived entries are excluded and existing product slugs remain stable. Invalid/missing prices are not invented. Existing 24-hour display expiry still applies. After the hosted runs verified successfully, the former six-hour local Mac LaunchAgent was disabled on 24 September 2026; the remote scheduler does not depend on the laptop. Existing API workflow preparation remains disabled and is a separate alternative.

## Boundaries and operations

Cloud IP access has to be tested: the same browser code working on the Mac does not establish that it works on a hosted runner. Captchas, access-denied responses, 403s and 429s stop the cloud run without publication; there are no proxies, login reuse or challenge bypasses. Browser collection does not establish Amazon's permission to reuse content; the owner's requested collection method and Amazon programme approval are separate matters.

The runner uses fresh anonymous Chromium, fixed discovery URLs, restricted merchant navigation and approved image-host validation. It writes only validated observations and tagged destinations. No screenshots, cookies, provider bodies, SQL files or credentials are uploaded as Actions artifacts. The Actions summary includes counts only. The run has a 20-minute collection budget and a 30-minute workflow timeout. On collection-budget expiry, validated observations are published and remaining URLs are counted as deferred. Skipped unavailable products do not mark a successful publication as failed. HTTP/layout failures can still interrupt collection. Failed discovery is visible as a failed GitHub run; it is not recorded as a successful D1 sync.

Disable `CLOUD_COLLECTOR_ENABLED` to stop scheduled publication. Manual `probe=true` remains available. With the variable disabled, a manual publish request is skipped. GitHub concurrency prevents overlapping cloud jobs, but does not coordinate with the existing Mac collector. A successful `cloud-browser:YYYY-MM-DD:morning|evening` D1 sync marker deduplicates each publication window; use manual `force=true` only for an intentional rerun. Morning and evening have independent active/success guards, and each window permits up to two attempts per IST day. Probes are excluded from that check. GitHub can disable schedules after 60 days of inactivity in public repositories; check the Actions page if daily runs stop.

The scheduler configuration lives in `worker/collector-scheduler/`; `.github/workflows/deploy-collector-scheduler.yml` deploys changes on main. Its `GITHUB_ACTIONS_TOKEN` is stored only as a Cloudflare Worker secret. The owner explicitly approved use of the existing signed-in GitHub credential on 24 September; its broader access is intentional, and a repository-scoped replacement can be rotated into the same secret later. Set scheduler `ENABLED=false` and redeploy to stop dispatches. The scheduler has no public HTTP endpoint.

On 24 September 2026, deployment at PR #5 initially failed when Cloudflare rejected four Cron Triggers because the account had reached its free-plan limit of five. The Worker uploaded a version but the new triggers were not attached. Deployment recovered with just the two requested primary schedules, which replaced the old trigger set. Main's follow-up deployment succeeded with the quota-safe config (run [36005982245](https://github.com/offerloom/offerloom/actions/runs/36005982245)). GitHub backups remain 08:00/18:00 IST.

The forced full refresh [36006003741](https://github.com/offerloom/offerloom/actions/runs/36006003741) completed on 24 September: 39 unique product URLs discovered (33 Today’s Deals, 32 New Releases, 30 from each of six bestseller category pages before cross-source deduplication), 111 validated, 10 added, 78 refreshed, 2 failed and 0 deferred. The live catalogue now shows 91 products; all three homepage shelves contain products, including four New Releases. Amazon product cards use OfferLoom tracked redirects with `offerloom-21`.

## Validation

Offline browser fixtures cover discovery, challenges and the existing price layouts. SQLite tests cover SQL escaping, stable slugs, affiliate tags, duplicate selection, new-product caps and archived-product handling. These tests cannot prove live cloud access. The build passes; unrelated existing repository lint errors remain in the deals page and reminder script.

References: [GitHub scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Live preflight — 23 September 2026

[Hosted runner probe](https://github.com/offerloom/offerloom/actions/runs/35805884817) succeeded: 30 bestseller product URLs discovered and one product observation validated without database writes. Full publication and the automatic schedule have now been verified; see below.

## Live publication and schedule verified — 23 September 2026

PR #3 is merged and `CLOUD_COLLECTOR_ENABLED=true`. The [first publication run](https://github.com/offerloom/offerloom/actions/runs/35806347704) added 10 products and refreshed 45, with 5 unvalidated products skipped. The subsequent [automatic scheduled run](https://github.com/offerloom/offerloom/actions/runs/35827491789) added another 10 and refreshed 56, with 4 skipped. The public catalogue now contains 71 products, including all 20 cloud additions with fresh prices. A new detail page returns 200 and its tracked redirect returns 302 to Amazon.in with `tag=offerloom-21`.

The earlier 23 September automatic run started at 12:05 IST, over five hours after its configured 07:00 IST schedule. Cloudflare now dispatches both requested daily windows and checks each window for missed or failed publication. Runner queueing and collection still mean that trigger time is not a promised website-update completion time. Partial collection failures appear in the summary and D1 sync history; they do not replace a missing observation with invented data. The existing Mac collector remains installed and unchanged.
