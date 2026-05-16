import type { AdapterName } from "@flexy/types";
import { saavnDev } from "./saavn-dev";
import { saavnSumit } from "./saavn-sumit";
import { nepotune } from "./nepotune";
import { jiosaavnPrivate } from "./jiosaavn-private";
import type { MusicAdapter } from "./types";
import type { Env } from "../env";

const ALL: MusicAdapter[] = [saavnDev, saavnSumit, nepotune, jiosaavnPrivate];

const isEnabledFlag = (env: Env, name: AdapterName): boolean => {
  switch (name) {
    case "saavn-dev":         return env.UPSTREAM_SAAVN_DEV !== "false";
    case "saavn-sumit":       return env.UPSTREAM_SAAVN_SUMIT !== "false";
    case "nepotune":          return env.UPSTREAM_NEPOTUNE !== "false";
    case "jiosaavn-private":  return env.UPSTREAM_JIOSAAVN_PRIVATE !== "false";
  }
};

/** Returns the active adapters sorted by priority desc, with KV health applied. */
export async function activeAdapters(env: Env): Promise<MusicAdapter[]> {
  const enabled = ALL.filter((a) => isEnabledFlag(env, a.name));

  // Demote adapters that recently failed (health score < 0.3 from KV).
  const healthEntries = await Promise.all(
    enabled.map(async (a) => {
      const raw = await env.OPS.get(`health:adapter:${a.name}`);
      const score = raw ? Number(raw) : 1;
      return [a, isFinite(score) ? score : 1] as const;
    }),
  );

  return healthEntries
    .map(([a, score]) => ({ a, score, weight: a.priority * score }))
    .sort((x, y) => y.weight - x.weight)
    .map(({ a }) => a);
}

/** Bump health score for an adapter (EMA). */
export async function recordAdapterResult(env: Env, name: AdapterName, ok: boolean) {
  const raw = await env.OPS.get(`health:adapter:${name}`);
  const prev = raw ? Number(raw) : 1;
  const next = 0.8 * prev + 0.2 * (ok ? 1 : 0);
  await env.OPS.put(`health:adapter:${name}`, next.toFixed(3), { expirationTtl: 60 * 60 * 24 });
}

/**
 * Run an operation against adapters in priority order until one succeeds.
 * Empty results count as failure for fallback purposes.
 */
export async function withFallback<T>(
  env: Env,
  op: (a: MusicAdapter) => Promise<T | null>,
  isEmpty: (t: T) => boolean = (t) => !t || (Array.isArray(t) && t.length === 0),
): Promise<{ value: T; source: AdapterName } | null> {
  const adapters = await activeAdapters(env);
  for (const a of adapters) {
    try {
      const v = await op(a);
      if (v != null && !isEmpty(v)) {
        await recordAdapterResult(env, a.name, true);
        return { value: v, source: a.name };
      }
      await recordAdapterResult(env, a.name, false);
    } catch {
      await recordAdapterResult(env, a.name, false);
    }
  }
  return null;
}

export { ALL as ALL_ADAPTERS };
