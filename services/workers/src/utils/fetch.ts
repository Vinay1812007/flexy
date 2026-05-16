/**
 * Timed, retry-aware fetch wrapper. Aborts at `timeoutMs` and returns null on
 * any non-2xx so callers can fall through to the next adapter cleanly.
 */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<Response | null> {
  const { timeoutMs = 4000, retries = 1 } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        cf: { cacheTtl: 60, cacheEverything: false },
        headers: {
          "user-agent": "Flexy/1.0 (+https://flexy.pages.dev)",
          accept: "application/json",
          ...(init.headers ?? {}),
        },
      });
      clearTimeout(t);
      if (res.ok) return res;
      // 5xx → retry; 4xx → give up
      if (res.status < 500 || attempt === retries) return null;
    } catch {
      clearTimeout(t);
      if (attempt === retries) return null;
    }
  }
  return null;
}

export async function safeJson<T = unknown>(
  url: string,
  init?: RequestInit,
  opts?: { timeoutMs?: number; retries?: number },
): Promise<T | null> {
  const res = await safeFetch(url, init, opts);
  if (!res) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
