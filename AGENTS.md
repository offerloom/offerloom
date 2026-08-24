# Repository Guidelines

## Project Structure & Module Organization

OfferLoom is a Vinext/React/TypeScript electronics comparison site.

- `app/`: pages, layout metadata, and global styles. The main shopping experience is in `app/page.tsx`.
- `public/`: static assets such as the favicon and Open Graph image.
- `db/` and `drizzle/`: Drizzle/D1 catalogue schema and migrations.
- `app/admin/`: owner-only catalogue workflow; `app/api/`: admin/public data routes.
- `app/go/amazon/`: tracked redirects to approved Amazon destinations.
- `worker/`: Cloudflare Worker entry point.
- `tests/`: Node-based rendered-output tests.
- `docs/`: business, architecture, security, and project handoff documentation.
- `.openai/hosting.json`: Sites deployment reference and logical resource bindings.

Keep product records in D1 rather than adding more hard-coded catalogue entries. Do not modify `examples/` when implementing production features.

## Build, Test, and Development Commands

Use Node.js `>=22.13.0` and preserve `package-lock.json`.

- `npm install`: install dependencies for local development.
- `npm run dev`: start the local Vinext server at `http://localhost:3000`.
- `npm run build`: produce the Cloudflare-compatible production build.
- `npm test`: build, then run Node tests from `tests/`.
- `npm run lint`: run ESLint across TypeScript and JavaScript sources.
- `npm run db:generate`: generate Drizzle migrations after an intentional schema change.

## Coding Style & Naming Conventions

Use TypeScript, React function components, two-space indentation, semicolons, and double quotes. Name components and types with `PascalCase`, functions and variables with `camelCase`, and route folders with lowercase descriptive names. Prefer accessible semantic HTML, labelled controls, keyboard-friendly interactions, and responsive CSS. Keep user-facing claims precise: demonstration, manually curated, and API-synchronized data must remain clearly distinguished.

## Testing Guidelines

Tests use the built-in `node:test` runner and `node:assert`. Name files `*.test.mjs`. Update rendered-output assertions whenever the intended page structure changes. Before submitting work, run `npm run build`, `npm run lint`, and relevant tests. Add tests for new routes, metadata, disclosures, and data transformations.

## Commit & Pull Request Guidelines

History uses short, imperative commit subjects, for example `Build OfferLoom electronics deals prototype`. Keep each commit focused. Pull requests should explain the user-visible outcome, list validation performed, reference any issue, and include screenshots for visual changes. Call out schema, deployment, or affiliate-link changes explicitly.

## Security & Affiliate Compliance

Never commit `.env` files, passwords, OTPs, tokens, banking documents, tax records, or affiliate API secrets. Use only approved merchant links, feeds, and licensed images; never scrape marketplaces. Do not present illustrative prices as live or enable outbound purchase buttons without valid approved destinations. Keep `/admin` restricted by the server-side email allowlist, and never expose raw click records publicly.
