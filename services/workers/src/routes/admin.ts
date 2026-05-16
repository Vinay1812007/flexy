import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { adminAuth } from "../middleware/admin";
import { ALL_ADAPTERS } from "../adapters";
import { migrate, topPlays, topSearches, recentErrors } from "../analytics/d1";
import { purgePrefix } from "../cache/kv";

const r = new Hono<{ Bindings: Env }>();
r.use("*", adminAuth());

r.post("/init", async (c) => {
  await migrate(c.env);
  return c.json({ error: false, data: { ok: true }, source: "saavn-dev", cached: false });
});

r.get("/analytics/plays", async (c) => {
  const days = Number(c.req.query("days") ?? 7);
  const limit = Number(c.req.query("limit") ?? 50);
  const data = await topPlays(c.env, days, limit);
  return c.json({ error: false, data, source: "saavn-dev", cached: false });
});

r.get("/analytics/searches", async (c) => {
  const days = Number(c.req.query("days") ?? 7);
  const limit = Number(c.req.query("limit") ?? 50);
  const data = await topSearches(c.env, days, limit);
  return c.json({ error: false, data, source: "saavn-dev", cached: false });
});

r.get("/errors", async (c) => {
  const limit = Number(c.req.query("limit") ?? 100);
  const data = await recentErrors(c.env, limit);
  return c.json({ error: false, data, source: "saavn-dev", cached: false });
});

r.get("/health", async (c) => {
  const results = await Promise.all(
    ALL_ADAPTERS.map(async (a) => {
      const t0 = Date.now();
      const ok = await a.health().catch(() => false);
      const ms = Date.now() - t0;
      const stored = await c.env.OPS.get(`health:adapter:${a.name}`);
      return { adapter: a.name, ok, ms, ema: stored ? Number(stored) : 1, priority: a.priority };
    }),
  );
  return c.json({ error: false, data: results, source: "saavn-dev", cached: false });
});

r.post("/cache/purge", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const p = z.object({ prefix: z.string().min(1).max(80) }).safeParse(body);
  if (!p.success) return c.json({ error: true, code: "bad_request", message: p.error.message, status: 400 }, 400);
  const n = await purgePrefix(c.env, p.data.prefix);
  return c.json({ error: false, data: { purged: n, prefix: p.data.prefix }, source: "saavn-dev", cached: false });
});

// ── CMS overrides ────────────────────────────────────────────────────
const cmsSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
  effectiveAt: z.number().optional(),
  ttlSec: z.number().int().min(60).max(60 * 60 * 24 * 30).optional(),
});

r.put("/cms", async (c) => {
  const body = await c.req.json().catch(() => null);
  const p = cmsSchema.safeParse(body);
  if (!p.success) return c.json({ error: true, code: "bad_request", message: p.error.message, status: 400 }, 400);
  const k = `cms:${p.data.key}`;
  await c.env.CATALOG.put(k, JSON.stringify(p.data.value), {
    expirationTtl: p.data.ttlSec ?? 60 * 60 * 24 * 7,
  });
  return c.json({ error: false, data: { ok: true, key: k }, source: "saavn-dev", cached: false });
});

r.delete("/cms/:key", async (c) => {
  await c.env.CATALOG.delete(`cms:${c.req.param("key")}`);
  return c.json({ error: false, data: { ok: true }, source: "saavn-dev", cached: false });
});

export default r;
