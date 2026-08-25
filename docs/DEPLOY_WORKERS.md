# Deploy OfferLoom to Cloudflare Workers

OfferLoom now deploys to `https://offerloom.<your-subdomain>.workers.dev` instead of ChatGPT Sites.

## One-time setup

1. Log in to Cloudflare:

```bash
npm run cf:login
```

2. Create the remote D1 database and write its id into `wrangler.toml`:

```bash
npm run cf:setup
```

3. Set the owner admin secret used by `/admin/login`:

```bash
npx wrangler secret put ADMIN_API_TOKEN
```

Choose a long random value and store it in your password manager. The current deployment already has a secret set; run the command again only if you need to rotate it.

4. For automatic deploys on `git push` to `main`, add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Create the API token in Cloudflare with **Workers Scripts: Edit** and **Account: Read** permissions, plus **D1: Edit** for migrations.

## Manual deploy

```bash
npm run deploy:full
```

This builds the Vinext app, applies D1 migrations remotely, and publishes the Worker.

## Admin access on Workers

- Public site: no change for visitors.
- `/admin` on Workers uses `/admin/login` with the `ADMIN_API_TOKEN` secret.
- ChatGPT Sites sign-in remains available only on `*.chatgpt.site` deployments.

## Local development

Local `npm run dev` still uses the mock admin user from `app/chatgpt-auth.ts`.

## Legacy ChatGPT Sites URL

`https://offerloom.gdwivedi6.chatgpt.site` can remain online until you point your public links to the new `workers.dev` URL or a custom domain.
