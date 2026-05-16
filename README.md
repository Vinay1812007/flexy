# Flexy 🎧

> Premium, mobile-first music streaming platform on Cloudflare's edge.
> Spotify-grade player · Resso-style immersive UI · JioSaavn-style Indian catalog.

[![CF Pages](https://img.shields.io/badge/Frontend-Cloudflare%20Pages-orange)](#deploy)
[![Workers](https://img.shields.io/badge/Backend-Cloudflare%20Workers-orange)](#deploy)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

Flexy streams real music sourced from public JioSaavn-compatible APIs, runs every
backend call on Cloudflare Workers, caches aggressively at the edge, and uses
Gemini for natural-language search, smart queue reordering, and AI playlists.

No authentication required to use the player.
No music files in the repo — everything flows through the adapter layer.

> **🚀 New to this? Don't have a dev environment?**
> Read [`CLOUD_DEPLOY.md`](./CLOUD_DEPLOY.md) — a 45-minute, click-by-click guide
> that takes you from zero to a live site using only your browser. No terminal,
> no Node, no Wrangler install required.

---

## ✨ Features

**For listeners**
- Personalized home with trending, recently-played, language-based, and CMS-curated rails (Hindi, Telugu, Tamil, Punjabi, English, …)
- Instant search across songs, albums, artists, playlists with debounced typing
- Spotify-style player: mini + immersive full screen, shuffle, repeat-one/all, gapless-ready engine, smooth seek bar, Media Session for OS controls
- Queue with add-to-queue, play-next, drag-reorder, AI smart-reorder
- Lyrics panel (synced when available, plain otherwise)
- Liked songs + recently played (persisted via localStorage)
- Keyboard shortcuts (Space, Shift+←/→, M, S, R, F)
- Mobile-first responsive layout with glassmorphism

**Powered by AI**
- "Play sad Telugu songs" → resolved into an actual song queue
- AI playlist generator from mood + language + seed artist
- Smart queue reorder by vibe coherence
- Next-song prediction from your listening history

**Admin dashboard**
- Top plays, top searches, recent errors (D1)
- Per-adapter API health monitor + EMA score
- KV cache purge by prefix
- CMS overrides for homepage hero / featured playlists / TTL'd content scheduling

---

## 🗂 Monorepo

```
flexy/
├── apps/
│   ├── web/       # User app (Cloudflare Pages)
│   └── admin/     # Admin dashboard (Cloudflare Pages)
├── packages/
│   ├── types/     # Shared TS contracts
│   ├── api-client/# Browser-side fetcher
│   ├── player/    # Framework-agnostic audio engine
│   └── ui/        # Shared components (Button, Skeleton, ScrollRail, Image)
└── services/
    └── workers/   # Hono.js worker (search, AI, admin, DOs)
        ├── adapters/  # saavn-dev, saavn-sumit, nepotune, jiosaavn-private
        ├── ai/        # Gemini wrapper
        ├── cache/     # KV + Cache API helpers
        ├── analytics/ # D1 (plays, searches, errors)
        ├── durable-objects/  # PlaybackSession
        └── middleware/
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the high-level diagram and data flows.

---

## 🛠 Local Development

Requirements: **Node ≥ 18.17**, **pnpm ≥ 9**, a Cloudflare account, a Gemini API key.

```bash
git clone <your-fork>
cd flexy
pnpm install
cp .env.example .env
```

### 1. Run the API (Workers)

```bash
cd services/workers
# Set your secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put ADMIN_TOKEN

# Provision Cloudflare resources (once)
wrangler kv:namespace create CATALOG
wrangler kv:namespace create CATALOG --preview
wrangler kv:namespace create OPS
wrangler kv:namespace create OPS --preview
wrangler d1 create flexy-analytics
wrangler r2 bucket create flexy-covers

# Paste the returned ids into wrangler.toml, then:
pnpm dev   # → http://localhost:8787
```

Initialize D1 tables (one-time):

```bash
curl -X POST http://localhost:8787/admin/init \
  -H "authorization: Bearer $ADMIN_TOKEN"
```

### 2. Run the web app

```bash
cd apps/web
echo "VITE_API_BASE=http://localhost:8787" > .env
pnpm dev   # → http://localhost:5173
```

### 3. Run the admin app

```bash
cd apps/admin
echo "VITE_API_BASE=http://localhost:8787" > .env
pnpm dev   # → http://localhost:5174
```

Sign in with your `ADMIN_TOKEN`.

### Or run everything in parallel

```bash
pnpm dev    # from repo root
```

---

## 🚀 Deploy

### Workers (API)

```bash
cd services/workers
pnpm deploy
# → https://flexy-api.<your-subdomain>.workers.dev
```

Point a custom domain at the worker if desired:

```bash
wrangler route add api.flexy.app/* flexy-api
```

### Pages (Web)

```bash
cd apps/web
pnpm build
wrangler pages deploy dist --project-name=flexy
```

In the Pages project settings, set:
- `VITE_API_BASE` → `https://api.flexy.app` (or your workers URL)

### Pages (Admin)

```bash
cd apps/admin
pnpm build
wrangler pages deploy dist --project-name=flexy-admin
```

Restrict access via Cloudflare Access (zero-trust) — recommended.

---

## 🔑 Environment Variables

### Workers (set with `wrangler secret put`)

| Name              | Required | Notes                            |
| ----------------- | :------: | -------------------------------- |
| `GEMINI_API_KEY`  | ✅       | Used by /ai/* routes             |
| `ADMIN_TOKEN`     | ✅       | Bearer token for /admin/*        |

### Workers `[vars]` (in `wrangler.toml`)

| Name                       | Default                                | Notes                          |
| -------------------------- | -------------------------------------- | ------------------------------ |
| `ALLOWED_ORIGINS`          | `https://flexy.pages.dev,...`          | Comma-separated CORS allowlist |
| `UPSTREAM_SAAVN_DEV`       | `true`                                 | Toggle adapter                 |
| `UPSTREAM_SAAVN_SUMIT`     | `true`                                 | Toggle adapter                 |
| `UPSTREAM_NEPOTUNE`        | `true`                                 | Toggle adapter                 |
| `UPSTREAM_JIOSAAVN_PRIVATE`| `true`                                 | Toggle adapter                 |

### Frontend (Vite)

| Name             | Required | Notes                       |
| ---------------- | :------: | --------------------------- |
| `VITE_API_BASE`  | ✅       | URL of the deployed Worker  |
| `VITE_APP_NAME`  | optional | Defaults to "Flexy"         |

---

## 📡 API Reference

All responses follow:
```json
{ "error": false, "data": <T>, "source": "<adapter>", "cached": <bool> }
```
Errors:
```json
{ "error": true, "code": "rate_limited", "message": "...", "status": 429 }
```

| Method | Path                                  | Notes                                    |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/`                                   | Service info + endpoint list             |
| GET    | `/health`                             | Liveness check                           |
| GET    | `/home?lang=hindi`                    | Homepage rails (cached 30 min)           |
| GET    | `/trending?lang=hindi`                | Trending tracks for a language           |
| GET    | `/search?q=&type=&limit=`             | Multi-type search (debounce client-side) |
| GET    | `/search/suggest?q=`                  | Cheap autosuggest list                   |
| GET    | `/song/:id`                           | Single song (includes downloadUrl[])     |
| GET    | `/song/:id/related`                   | Related song list                        |
| GET    | `/album/:id`                          | Album with songs[]                       |
| GET    | `/artist/:id`                         | Artist with topSongs/topAlbums           |
| GET    | `/playlist/:id`                       | Playlist with songs[]                    |
| GET    | `/lyrics/:id`                         | Plain + (when available) synced lines    |
| POST   | `/ai/nl`                              | `{"prompt":"..."}` → intent + filters    |
| POST   | `/ai/next-song`                       | `{"history":[...]}` → next Song          |
| POST   | `/ai/smart-queue`                     | `{"queue":[ids]}` → reordered ids        |
| POST   | `/ai/playlist`                        | `{mood,language,seed,size}` → Playlist   |
| ALL    | `/session/:id`                        | Durable Object (WebSocket)               |
| POST   | `/admin/init`                         | Migrate D1 tables (auth)                 |
| GET    | `/admin/health`                       | Per-adapter probe                        |
| GET    | `/admin/analytics/plays?days=7`       |                                          |
| GET    | `/admin/analytics/searches?days=7`    |                                          |
| GET    | `/admin/errors`                       |                                          |
| POST   | `/admin/cache/purge`                  | `{"prefix":"search:"}`                   |
| PUT    | `/admin/cms`                          | `{key,value,ttlSec}`                     |
| DELETE | `/admin/cms/:key`                     |                                          |

See [`examples/`](./examples) for full sample responses.

---

## ⌨️ Keyboard Shortcuts

| Key                | Action                |
| ------------------ | --------------------- |
| `Space`            | Play / pause          |
| `Shift + →`        | Next                  |
| `Shift + ←`        | Previous              |
| `Shift + ↑ / ↓`    | Volume +/-            |
| `M`                | Mute toggle           |
| `S`                | Shuffle toggle        |
| `R`                | Repeat cycle          |
| `F`                | Full-screen player    |

---

## 🧪 Quality

- TypeScript strict everywhere (`noUncheckedIndexedAccess`)
- `zod` validates every inbound JSON body
- Per-IP KV-backed rate limits on `/search`, `/ai`
- Per-adapter EMA health tracked in KV — broken upstreams get demoted
- D1 logs every error (`/admin/errors` surfaces them)
- Route-level code splitting; manual chunks for react/router/query/motion
- Image: lazy + decoding=async + skeleton

## License

MIT
