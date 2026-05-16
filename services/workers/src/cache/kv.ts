import type { Env } from "../env";

/**
 * Two-level cache: Cache API (per-edge) first, KV (global) second.
 * Use for read-mostly catalog data — search results, album/artist payloads.
 */
export async function cached<T>(
  env: Env,
  key: string,
  ttl: number,
  loader: () => Promise<T>,
  request?: Request,
): Promise<{ value: T; cached: boolean }> {
  // 1) Edge Cache API (uses request URL as key; if no request, skip)
  if (request) {
    const cache = caches.default;
    const cacheKey = new Request(new URL(`https://cache.internal/${encodeURIComponent(key)}`).toString(), { method: "GET" });
    const hit = await cache.match(cacheKey);
    if (hit) {
      try { return { value: (await hit.json()) as T, cached: true }; } catch { /* fall through */ }
    }
  }

  // 2) KV
  const kv = await env.CATALOG.get(key, "json") as T | null;
  if (kv != null) {
    if (request) {
      const cache = caches.default;
      const cacheKey = new Request(new URL(`https://cache.internal/${encodeURIComponent(key)}`).toString());
      const res = new Response(JSON.stringify(kv), {
        headers: { "content-type": "application/json", "cache-control": `public, max-age=${Math.min(ttl, 300)}` },
      });
      await cache.put(cacheKey, res.clone());
    }
    return { value: kv, cached: true };
  }

  // 3) Origin loader
  const value = await loader();
  // store in KV (longer TTL) and Cache API (shorter)
  await env.CATALOG.put(key, JSON.stringify(value), { expirationTtl: ttl }).catch(() => {});
  if (request) {
    const cache = caches.default;
    const cacheKey = new Request(new URL(`https://cache.internal/${encodeURIComponent(key)}`).toString());
    const res = new Response(JSON.stringify(value), {
      headers: { "content-type": "application/json", "cache-control": `public, max-age=${Math.min(ttl, 300)}` },
    });
    await cache.put(cacheKey, res.clone());
  }
  return { value, cached: false };
}

/** Purge a KV prefix (admin tool). KV doesn't support prefix-delete, so we list+delete. */
export async function purgePrefix(env: Env, prefix: string): Promise<number> {
  let cursor: string | undefined;
  let count = 0;
  do {
    const list = await env.CATALOG.list({ prefix, cursor });
    await Promise.all(list.keys.map((k) => env.CATALOG.delete(k.name)));
    count += list.keys.length;
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return count;
}
