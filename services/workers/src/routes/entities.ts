import { Hono } from "hono";
import type { Env } from "../env";
import { withFallback } from "../adapters";
import { cached } from "../cache/kv";
import { logPlay } from "../analytics/d1";

const r = new Hono<{ Bindings: Env }>();

r.get("/song/:id", async (c) => {
  const id = c.req.param("id");
  const key = `song:${id}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 60 * 6, async () => {
    const out = await withFallback(c.env, (a) => a.songById(id), (x) => !x);
    if (!out) throw new Error("song not found");
    return out.value;
  }, c.req.raw);
  c.executionCtx.waitUntil(logPlay(c.env, { id: value.id, name: value.name }));
  return c.json({ error: false, data: value, source: value.source, cached: isCached });
});

r.get("/song/:id/related", async (c) => {
  const id = c.req.param("id");
  const key = `song:${id}:related`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 60, async () => {
    const out = await withFallback(c.env, (a) => a.related?.(id) ?? Promise.resolve(null), (x) => !x || x.length === 0);
    if (!out) return [];
    return out.value;
  }, c.req.raw);
  return c.json({ error: false, data: value, source: "saavn-dev", cached: isCached });
});

r.get("/album/:id", async (c) => {
  const id = c.req.param("id");
  const key = `album:${id}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 60 * 12, async () => {
    const out = await withFallback(c.env, (a) => a.albumById(id), (x) => !x);
    if (!out) throw new Error("album not found");
    return out.value;
  }, c.req.raw);
  return c.json({ error: false, data: value, source: value.source, cached: isCached });
});

r.get("/artist/:id", async (c) => {
  const id = c.req.param("id");
  const key = `artist:${id}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 60 * 12, async () => {
    const out = await withFallback(c.env, (a) => a.artistById(id), (x) => !x);
    if (!out) throw new Error("artist not found");
    return out.value;
  }, c.req.raw);
  return c.json({ error: false, data: value, source: value.source, cached: isCached });
});

r.get("/playlist/:id", async (c) => {
  const id = c.req.param("id");
  const key = `playlist:${id}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 60 * 6, async () => {
    const out = await withFallback(c.env, (a) => a.playlistById(id), (x) => !x);
    if (!out) throw new Error("playlist not found");
    return out.value;
  }, c.req.raw);
  return c.json({ error: false, data: value, source: value.source, cached: isCached });
});

r.get("/lyrics/:id", async (c) => {
  const id = c.req.param("id");
  const key = `lyrics:${id}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 60 * 24, async () => {
    const out = await withFallback(c.env, (a) => a.lyrics?.(id) ?? Promise.resolve(null), (x) => !x);
    if (!out) return { songId: id, synced: [], source: "external" as const };
    return {
      songId: id,
      plain: out.value.plain,
      synced: out.value.synced ?? [],
      source: out.source,
    };
  }, c.req.raw);
  return c.json({ error: false, data: value, source: "external", cached: isCached });
});

export default r;
