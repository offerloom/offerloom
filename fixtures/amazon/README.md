# Amazon.in layout fixtures

Hand-written, minimal approximations of the price/title/image markup that Amazon.in product pages
used in September 2026. They are **not** saved Amazon pages. `tests/browser-collector.test.mjs`
serves them through Playwright request interception, so no test ever contacts Amazon.

When a live product fails with "Missing product title, image or price", open
`outputs/collector/failures/<ASIN>.json` on the Mac: its `priceCandidates` lines show the element
path that holds the price. Add a matching fixture here and the selector to `SELECTORS` in
`scripts/browser-collector.mjs`.
