import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { withFallback } from "../adapters";
import { cached } from "../cache/kv";
import { rateLimit } from "../middleware/ratelimit";
import { logSearch } from "../analytics/d1";
import type { SearchResult } from "@flexy/types";

const r = new Hono<{ Bindings: Env }>();

const searchSchema = z.object({
  q: z.string().min(1).max(120),
  type: z.enum(["all", "song", "album", "artist", "playlist"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

r.use("*", rateLimit("search", 60, 60));

r.get("/", async (c) => {
  const parsed = searchSchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) {
    return c.json({ error: true, code: "bad_request", message: parsed.error.message, status: 400 }, 400);
  }
  const { q, type, limit } = parsed.data;
  const key = `search:${type}:${limit}:${q.toLowerCase()}`;

  try {
    const { value, cached: isCached } = await cached(c.env, key, 60 * 60, async () => {
      const out = await withFallback<SearchResult>(c.env, (a) => a.search(q, type, limit),
        (r) =>
          !r ||
          (r.songs.results.length + r.albums.results.length +
           r.artists.results.length + r.playlists.results.length === 0),
      );
      if (!out) throw new Error("no upstream returned results");
      return out.value;
    }, c.req.raw);

    c.executionCtx.waitUntil(logSearch(c.env, q));
    return c.json({ error: false, data: value, source: value.source, cached: isCached });
  } catch (e) {
    return c.json({ error: true, code: "upstream_failed", message: (e as Error).message, status: 502 }, 502);
  }
});

r.get("/suggest", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (!q) return c.json({ error: false, data: [], source: "saavn-dev", cached: false });
  const key = `suggest:${q.toLowerCase()}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 30, async () => {
    // cheap: derive from quick song search
    const out = await withFallback(c.env, (a) => a.search(q, "song", 8));
    if (!out) return [] as string[];
    return out.value.songs.results.map((s) => s.name);
  }, c.req.raw);
  return c.json({ error: false, data: value, source: "saavn-dev", cached: isCached });
});

export default r;
