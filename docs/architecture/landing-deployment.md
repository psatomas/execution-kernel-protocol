# Deploying apps/landing (exekpro.com) to Cloudflare

How `apps/landing` actually gets from a push on `main` to a live page at
`exekpro.com`. Chosen host: **Cloudflare Workers**, via
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) — the
current (GA since Feb 2026) adapter Cloudflare's own docs point to for
running an existing Next.js app with no rewrite. (Cloudflare also has a
much newer, explicitly experimental tool called `vinext` for this same
job — deliberately not used here for a real domain.)

## What's already done, in this repo

- `apps/landing/wrangler.jsonc` — the Worker's config. No KV namespace, no
  R2 bucket, no service binding: this site has zero dynamic data and zero
  ISR/revalidation, so the incremental-cache storage those bindings back
  has nothing to cache. Add one only if a route here ever actually needs
  ISR.
- `apps/landing/open-next.config.ts` — minimal, same reason.
- `.github/workflows/deploy-landing.yml` — builds and deploys on every
  push to `main` that touches `apps/landing/**` (or via manual dispatch).
- The one real code change this required: `opengraph-image.tsx` used to
  read `public/wordmark.png` via `fs.readFileSync` at request time. That
  works on Node/Vercel but fails on Cloudflare Workers — confirmed with a
  real `wrangler dev` run, not assumed — because the OpenNext bundle
  doesn't carry `public/` into the deployed Worker's filesystem the same
  way. Fixed by embedding the image as a base64 literal
  (`wordmark-base64.ts`) instead, which works identically everywhere.

Verified locally end-to-end against the **real Cloudflare Workers runtime**
(`wrangler dev`, not just `next dev`) before any of this was committed:
every route — the page itself, `/icon.png`, `/apple-icon.png`,
`/opengraph-image`, and the static assets in `public/` — returns 200 and
renders correctly.

## What you need to do (once)

### 1. A Cloudflare API token

Cloudflare dashboard → profile icon → **My Profile → API Tokens → Create
Token** → use the **"Edit Cloudflare Workers"** template (or a custom
token with `Account.Workers Scripts: Edit` and `Account.Account
Settings: Read`, plus `Zone.DNS: Edit` on the `exekpro.com` zone once you
connect the custom domain in step 4). Scope it to the account that owns
`exekpro.com`.

### 2. Your Account ID

Cloudflare dashboard → **Workers & Pages** (or any domain's Overview page)
→ the Account ID is shown in the right-hand sidebar.

### 3. Add both to this GitHub repo

**Settings → Secrets and variables → Actions → New repository secret**,
twice:

- `CLOUDFLARE_API_TOKEN` — from step 1
- `CLOUDFLARE_ACCOUNT_ID` — from step 2

(Or from your own terminal: `gh secret set CLOUDFLARE_API_TOKEN` /
`gh secret set CLOUDFLARE_ACCOUNT_ID`, if you'd rather not paste them into
the GitHub web UI.)

### 4. First deploy, then connect the domain

Once the secrets exist, either push to `main` (the workflow runs
automatically) or trigger it manually from the **Actions** tab
(`Deploy landing` → `Run workflow`). This creates the Worker
(`exekpro-landing`) on Cloudflare the first time it runs — nothing needs
to be manually created in the dashboard beforehand.

After that first deploy exists: Cloudflare dashboard → **Workers & Pages**
→ `exekpro-landing` → **Settings → Domains & Routes → Add Custom Domain**
→ enter `exekpro.com`. Since the domain is already in the same Cloudflare
account, this auto-provisions the DNS record for you — no manual DNS entry
required, unlike pointing a domain at a non-Cloudflare host.

## Testing locally before pushing

```bash
cd apps/landing
npm run preview   # builds + runs the real Workers runtime locally via wrangler
```

This runs the actual Cloudflare Workers sandbox on your machine (not just
`next dev`), the same environment the checks above were run against.

## What this deliberately does not do

No KV, no R2, no Durable Objects, no custom domain routing beyond the one
domain, no staging environment, no deployment approval gate — none of
which this static marketing site currently needs. Add them if and when a
real requirement for one shows up, not speculatively.
