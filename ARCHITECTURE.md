# Flexy — Architecture

> A premium, mobile-first music streaming platform built on Cloudflare's edge.
> Spotify-grade player, Resso-style immersive UI, JioSaavn-style Indian catalog.

---

## 1. High-Level Diagram

```
            ┌────────────────────────────────────────────────────┐
            │                     Users (Web/PWA)                │
            └─────────────────────────┬──────────────────────────┘
                                      │ HTTPS
            ┌─────────────────────────▼──────────────────────────┐
            │           Cloudflare Pages — apps/web              │
            │   React + Vite + Tailwind + Framer + Zustand       │
            │   ◦ Player engine (HTML5 Audio)                    │
            │   ◦ React Query cache                              │
            │   ◦ Service worker (optional PWA)                  │
            └─────────────────────────┬──────────────────────────┘
                                      │ /api/*  (fetch)
            ┌─────────────────────────▼──────────────────────────┐
            │      Cloudflare Workers — services/workers         │
            │       Hono.js · TypeScript · edge-native           │
            │                                                    │
            │  ┌──────────────┐   ┌───────────────┐              │
            │  │ Routes layer │   │  AI (Gemini)  │              │
            │  └──────┬───────┘   └───────┬───────┘              │
            │         │                   │                      │
            │  ┌──────▼───────────────────▼───────┐              │
            │  │       Adapter / Fallback         │              │
            │  │  saavn.dev → sumit → nepotune    │              │
            │  │           → jiosaavn-private     │              │
            │  └──────────────┬───────────────────┘              │
            │                 │ normalize                        │
            └─────────────────┼──────────────────────────────────┘
                              │
        ┌─────────────┬───────┼──────────┬─────────────┐
        │             │       │          │             │
   ┌────▼────┐   ┌────▼───┐ ┌─▼────┐ ┌───▼───┐  ┌──────▼─────┐
   │   KV    │   │ Cache  │ │  D1  │ │  R2   │  │  Durable   │
   │ catalog │   │  API   │ │stats │ │covers │  │  Objects   │
   │  hot    │   │ edge   │ │admin │ │ cache │  │ playback   │
   └─────────┘   └────────┘ └──────┘ └───────┘  └────────────┘
```

---

## 2. Monorepo Layout

```
flexy/
├── apps/
│   ├── web/        # User-facing Cloudflare Pages app
│   └── admin/      # Admin dashboard (also Cloudflare Pages)
├── packages/
│   ├── types/      # Shared TS types (Song, Album, Artist, Playlist, …)
│   ├── api-client/ # Browser-side fetcher (used by web + admin)
│   ├── player/     # Framework-agnostic audio engine
│   └── ui/         # Shared design-system primitives (Button, Skeleton, …)
└── services/
    └── workers/    # Cloudflare Workers backend (Hono)
        ├── routes/      # /search /home /song /album /artist /playlist /ai /admin
        ├── adapters/    # One file per upstream API + a unified normalizer
        ├── ai/          # Gemini wrapper (next-song, NL parse, smart queue)
        ├── cache/       # KV + Cache-API helpers
        ├── analytics/   # D1 helpers (plays, search, errors)
        ├── durable-objects/  # PlaybackSession (real-time queue sync)
        └── middleware/  # CORS, rate-limit, admin auth
```

---

## 3. Data Flow — A Search Request

1. User types in the search bar → `useDebouncedSearch` waits 250 ms.
2. React Query hits `GET /search?q=…&type=all`.
3. Worker checks **Cache API** (URL key) → hit returns instantly with `cf-cache: HIT`.
4. On miss, **KV** is checked (`search:q:type` for popular queries).
5. On KV miss, the **adapter layer** races/fans-out to upstream APIs:
   - Strategy = "first-success": try `saavn.dev` first; if 5xx / timeout / bad-shape, fall through to `sumit` → `nepotune` → `jiosaavn-private`.
   - Each adapter normalizes its response into the shared `Song | Album | Artist | Playlist` schema.
6. Result is written to **KV** (TTL 1 h for search) and **Cache API** (TTL 5 min).
7. Worker emits an analytics event to **D1** asynchronously (`waitUntil`).
8. Response returned to the client with `etag` for revalidation.

---

## 4. Music Adapter Layer

All upstreams have similar but not identical shapes. The adapter contract:

```ts
export interface MusicAdapter {
  name: string;
  search(q: string, type?: SearchType): Promise<SearchResult>;
  songById(id: string): Promise<Song | null>;
  albumById(id: string): Promise<Album | null>;
  artistById(id: string): Promise<Artist | null>;
  playlistById(id: string): Promise<Playlist | null>;
  trending(lang?: string): Promise<Song[]>;
  // returns 0..1 health score for the admin monitor
  health(): Promise<number>;
}
```

The `runWithFallback()` helper:

- Tries adapters in priority order.
- Per-call timeout (default 4 s) with `AbortController`.
- On error/timeout/empty, falls through to the next adapter.
- Adapter health is tracked in KV (`health:adapter:<name>`) — bad adapters are temporarily demoted.

---

## 5. Audio Engine

Lives in `packages/player`. Framework-agnostic, exports:

- `createPlayer()` → returns a controller with `play/pause/seek/volume/load/destroy`.
- An event emitter (`time`, `ended`, `error`, `buffering`, `loaded`).
- Crossfade simulation via two `HTMLAudioElement` instances + gain ramp.
- Media Session API for OS-level controls (lockscreen, headset buttons).
- Background-tab keep-alive with `wakeLock` + silent oscillator fallback.

The React app wraps this in `useAudio()` and a Zustand store (`usePlayerStore`).

---

## 6. State Management

- **Zustand** (persisted to `localStorage`):
  - `playerStore` — current song, position, playing flag, volume, repeat, shuffle.
  - `queueStore` — array of songs, history, "play next".
  - `libraryStore` — liked songs, recently played (last 100).
- **React Query** — all server data with sane stale times:
  - search: `staleTime: 30s`
  - home/trending: `staleTime: 10m`
  - album/artist/playlist: `staleTime: 1h`

---

## 7. AI Layer (Gemini)

Everything goes through the worker so the key never leaves the edge.

| Endpoint                       | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `POST /ai/next-song`           | Predict best next track from history     |
| `POST /ai/smart-queue`         | Reorder a queue by vibe coherence        |
| `POST /ai/playlist`            | Generate a playlist from mood+lang+seed  |
| `POST /ai/nl`                  | Parse "play sad Telugu songs" → query    |
| `POST /ai/mood`                | Classify a song's mood from metadata     |

Each is rate-limited per-IP in KV (`rl:ip:ai:<ip>`).

---

## 8. Durable Objects

`PlaybackSession` keeps the queue/position in sync across the user's devices
using WebSockets. The session id is generated on first load and stored client-side.

This is **optional** — the app works fully without it; if the WebSocket fails,
the client falls back to `localStorage`-only.

---

## 9. Admin Surface

`/admin` is a separate Vite app deployed to its own Pages project, gated by a
bearer token (`ADMIN_TOKEN`). All admin routes on the Worker enforce the token.

Sections:

- **Analytics** — top songs, plays/day, search terms (from D1).
- **Content** — feature playlists, banners, hero rails (writes to KV `cms:*`).
- **API Health** — live health() probes + 24h success-rate from D1.
- **Cache** — buttons to purge specific KV prefixes / refresh trending.
- **Errors** — last 500 worker errors with stack/route.
- **Schedule** — write future `cms:*` entries with `effectiveAt`.

---

## 10. Performance Budget

| Metric                 | Target            |
| ---------------------- | ----------------- |
| LCP (mobile, 4G)       | < 2.0 s           |
| INP                    | < 200 ms          |
| JS shipped (gzipped)   | < 180 kB          |
| API p50                | < 120 ms (edge)   |
| API p99 (cache miss)   | < 1.5 s           |

Tactics: route-level code splitting, virtualized lists (≥ 50 rows),
`<img loading="lazy" decoding="async">`, Cloudflare Image transforms for
covers, HTTP/3 + Brotli on Pages.

---

## 11. Security

- No secrets in frontend — only `VITE_API_BASE` is public.
- `wrangler secret put` for `GEMINI_API_KEY`, `ADMIN_TOKEN`.
- All inbound JSON validated with `zod` schemas.
- Per-IP rate limit at the Worker edge (KV counter, sliding window).
- CORS allowlist via `ALLOWED_ORIGINS`.
- CSP header on Pages restricts script/img/connect sources.
