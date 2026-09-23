# Cloud browser collector

The owner requested the existing browser collection method on 23 September 2026, rather than waiting for Creators API eligibility. This implementation reuses `collect()` from `scripts/browser-collector.mjs`: public product page → validated title/image/price → D1 catalogue → affiliate redirect with `offerloom-21`.

## Execution

`.github/workflows/cloud-collector.yml` runs on a GitHub-hosted Ubuntu runner, independent of the owner's laptop. Its daily schedule targets 07:00 IST; GitHub scheduling is approximate and can be delayed. Publication requires the workflow on the default branch and repository variable `CLOUD_COLLECTOR_ENABLED=true`. Existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets provide D1 access. It does not need Creators API credentials, Amazon login cookies or a browser extension.

The `--probe` command tests one bestseller category and one product without D1 access or writes. Branch pushes run this probe. Scheduled/publish runs examine six bestseller categories, validate up to 30 new candidates (up to five from each category), select at most ten with an observed discount of at least 10%, and refresh up to 100 existing active products, oldest first. An item appearing in a bestseller category is a discovery candidate; it is not advertised as a verified global bestseller. New eligible deals may number zero.

Paused/archived entries are excluded and existing product slugs remain stable. Invalid/missing prices are not invented. Existing 24-hour display expiry still applies. The Mac collector remains installed; disabling it should follow successful cloud publication verification. Existing API workflow preparation remains disabled and is a separate alternative.

## Boundaries and operations

Cloud IP access has to be tested: the same browser code working on the Mac does not establish that it works on a hosted runner. Captchas, access-denied responses, 403s and 429s stop the cloud run without publication; there are no proxies, login reuse or challenge bypasses. Browser collection does not establish Amazon's permission to reuse content; the owner's requested collection method and Amazon programme approval are separate matters.

The runner uses fresh anonymous Chromium, fixed discovery URLs, restricted merchant navigation and approved image-host validation. It writes only validated observations and tagged destinations. No screenshots, cookies, provider bodies, SQL files or credentials are uploaded as Actions artifacts. The Actions summary includes counts only. The run has a 20-minute collection budget and a 30-minute workflow timeout. HTTP/layout failures can still interrupt collection. Failed discovery is visible as a failed GitHub run; it is not recorded as a successful D1 sync.

Disable `CLOUD_COLLECTOR_ENABLED` to stop scheduled publication. Manual `probe=true` remains available. With the variable disabled, a manual publish request is skipped. GitHub concurrency prevents overlapping cloud jobs, but does not coordinate with the existing Mac collector. GitHub can disable schedules after 60 days of inactivity in public repositories; check the Actions page if daily runs stop.

## Validation

Offline browser fixtures cover discovery, challenges and the existing price layouts. SQLite tests cover SQL escaping, stable slugs, affiliate tags, duplicate selection, new-product caps and archived-product handling. These tests cannot prove live cloud access. The build passes; unrelated existing repository lint errors remain in the deals page and reminder script.

References: [GitHub scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Live preflight — 23 September 2026

[Hosted runner probe](https://github.com/offerloom/offerloom/actions/runs/35805884817) succeeded: 30 bestseller product URLs discovered and one product observation validated without database writes. Full publication and the automatic schedule have now been verified; see below.

## Live publication and schedule verified — 23 September 2026

PR #3 is merged and `CLOUD_COLLECTOR_ENABLED=true`. The [first publication run](https://github.com/offerloom/offerloom/actions/runs/35806347704) added 10 products and refreshed 45, with 5 unvalidated products skipped. The subsequent [automatic scheduled run](https://github.com/offerloom/offerloom/actions/runs/35827491789) added another 10 and refreshed 56, with 4 skipped. The public catalogue now contains 71 products, including all 20 cloud additions with fresh prices. A new detail page returns 200 and its tracked redirect returns 302 to Amazon.in with `tag=offerloom-21`.

The automatic run started at 12:05 IST, over five hours after its configured 07:00 IST schedule. Treat this as a daily scheduler, not a punctual service. Exact-time requirements would need another scheduler. Partial collection failures appear in the summary and D1 sync history; they do not replace a missing observation with invented data. The existing Mac collector remains installed and unchanged.
