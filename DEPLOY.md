# Deployment — step by step

A 10-minute walkthrough from a fresh fork to a live `flexy.pages.dev`.

## 1. Prereqs

```bash
node --version    # ≥ 18.17
pnpm --version    # ≥ 9
wrangler --version
```

```bash
pnpm install
wrangler login
```

## 2. Create the Cloudflare resources

```bash
cd services/workers

# KV
wrangler kv:namespace create CATALOG
wrangler kv:namespace create CATALOG --preview
wrangler kv:namespace create OPS
wrangler kv:namespace create OPS --preview

# D1
wrangler d1 create flexy-analytics

# R2 (optional cover cache)
wrangler r2 bucket create flexy-covers
```

Copy the returned `id` / `preview_id` / `database_id` values into
`services/workers/wrangler.toml`, replacing the `REPLACE_WITH_*` placeholders.

## 3. Set secrets

```bash
wrangler secret put GEMINI_API_KEY
wrangler secret put ADMIN_TOKEN     # any long random string
```

## 4. Deploy the worker

```bash
pnpm deploy   # in services/workers
```

Note the URL (e.g. `https://flexy-api.<yours>.workers.dev`).

Initialize the analytics tables:

```bash
curl -X POST https://flexy-api.<yours>.workers.dev/admin/init \
  -H "authorization: Bearer <ADMIN_TOKEN>"
```

## 5. Deploy the web app

```bash
cd apps/web
echo "VITE_API_BASE=https://flexy-api.<yours>.workers.dev" > .env.production
pnpm build
wrangler pages deploy dist --project-name=flexy
```

After the first deploy, edit `apps/web/_redirects` if you want `/api/*` to be
proxied from your Pages domain to your Workers URL.

## 6. Deploy the admin

```bash
cd apps/admin
echo "VITE_API_BASE=https://flexy-api.<yours>.workers.dev" > .env.production
pnpm build
wrangler pages deploy dist --project-name=flexy-admin
```

In Cloudflare Dashboard → Zero Trust → Access, restrict the admin domain
to a team email allowlist. (Optional but strongly recommended.)

## 7. Custom domains

```bash
wrangler route add api.flexy.app/* flexy-api
# In the Pages dashboard, attach flexy.app and admin.flexy.app to the two projects.
```

Update `ALLOWED_ORIGINS` in `wrangler.toml` to include your custom domains and
re-deploy.

## 8. Verify

- `https://api.flexy.app/health` → `{ "ok": true, "ts": ... }`
- `https://flexy.app/` → home page renders
- `https://admin.flexy.app/` → asks for admin token, then dashboard

## Troubleshooting

- **CORS errors** — confirm your origin is in `ALLOWED_ORIGINS`, redeploy.
- **Empty home rails** — `/admin/health` → if every adapter is `ok:false` you're
  rate-limited upstream; re-enable some adapters or wait.
- **AI endpoints 502** — verify `GEMINI_API_KEY` and that the key has access to
  `gemini-1.5-flash`.
- **D1 missing tables** — re-run `POST /admin/init`.
