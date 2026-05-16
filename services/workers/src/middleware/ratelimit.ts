import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

/**
 * Sliding-window rate limiter using KV counters. Coarse but cheap.
 *   tag — used as KV prefix (e.g. "search", "ai")
 *   limit — max requests per window
 *   windowSec — window length in seconds
 */
export const rateLimit = (tag: string, limit: number, windowSec: number): MiddlewareHandler<{ Bindings: Env }> =>
  async (c, next) => {
    const ip =
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anon";
    const bucket = Math.floor(Date.now() / 1000 / windowSec);
    const key = `rl:${tag}:${ip}:${bucket}`;
    const cur = Number((await c.env.OPS.get(key)) ?? 0);
    if (cur >= limit) {
      return c.json(
        { error: true, code: "rate_limited", message: "Too many requests", status: 429 },
        429,
      );
    }
    await c.env.OPS.put(key, String(cur + 1), { expirationTtl: windowSec * 2 });
    await next();
  };
