const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

export function getToken() {
  return localStorage.getItem("flexy-admin-token") ?? "";
}
export function setToken(t: string) {
  localStorage.setItem("flexy-admin-token", t);
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${getToken()}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json() as any;
  if (!res.ok || json.error) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

export const adminApi = {
  init: () => req<{ ok: boolean }>("/admin/init", { method: "POST" }),
  health: () => req<{ adapter: string; ok: boolean; ms: number; ema: number; priority: number }[]>("/admin/health"),
  plays: (days = 7) => req<{ song_id: string; song_name: string; plays: number }[]>(`/admin/analytics/plays?days=${days}`),
  searches: (days = 7) => req<{ query: string; hits: number }[]>(`/admin/analytics/searches?days=${days}`),
  errors: () => req<{ route: string; message: string; ts: number }[]>("/admin/errors"),
  purge: (prefix: string) => req<{ purged: number }>("/admin/cache/purge", {
    method: "POST", body: JSON.stringify({ prefix }),
  }),
  setCms: (key: string, value: unknown, ttlSec?: number) =>
    req<{ ok: boolean }>("/admin/cms", { method: "PUT", body: JSON.stringify({ key, value, ttlSec }) }),
  deleteCms: (key: string) => req<{ ok: boolean }>(`/admin/cms/${encodeURIComponent(key)}`, { method: "DELETE" }),
};
