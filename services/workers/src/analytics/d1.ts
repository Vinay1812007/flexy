import type { Env } from "../env";

/**
 * Analytics & ops tables. The /admin/init endpoint runs these migrations.
 */
export const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS plays (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     song_id TEXT NOT NULL,
     song_name TEXT,
     ts INTEGER NOT NULL
   );`,
  `CREATE INDEX IF NOT EXISTS plays_song_idx ON plays(song_id);`,
  `CREATE INDEX IF NOT EXISTS plays_ts_idx ON plays(ts);`,

  `CREATE TABLE IF NOT EXISTS searches (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     query TEXT NOT NULL,
     ts INTEGER NOT NULL
   );`,
  `CREATE INDEX IF NOT EXISTS searches_ts_idx ON searches(ts);`,

  `CREATE TABLE IF NOT EXISTS errors (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     route TEXT NOT NULL,
     message TEXT,
     stack TEXT,
     ts INTEGER NOT NULL
   );`,
];

export async function migrate(env: Env) {
  for (const sql of MIGRATIONS) {
    await env.DB.exec(sql.replace(/\s+/g, " ").trim());
  }
}

export async function logPlay(env: Env, song: { id: string; name: string }) {
  try {
    await env.DB.prepare("INSERT INTO plays (song_id, song_name, ts) VALUES (?1, ?2, ?3)")
      .bind(song.id, song.name, Date.now())
      .run();
  } catch { /* swallow — analytics must never break a request */ }
}

export async function logSearch(env: Env, query: string) {
  try {
    await env.DB.prepare("INSERT INTO searches (query, ts) VALUES (?1, ?2)")
      .bind(query.slice(0, 200), Date.now())
      .run();
  } catch { /* swallow */ }
}

export async function logError(env: Env, route: string, err: unknown) {
  try {
    const e = err as Error;
    await env.DB.prepare("INSERT INTO errors (route, message, stack, ts) VALUES (?1, ?2, ?3, ?4)")
      .bind(route, e?.message ?? String(err), e?.stack ?? "", Date.now())
      .run();
  } catch { /* swallow */ }
}

export async function topPlays(env: Env, days = 7, limit = 50) {
  const since = Date.now() - days * 86_400_000;
  const r = await env.DB.prepare(
    `SELECT song_id, song_name, COUNT(*) AS plays
       FROM plays WHERE ts >= ?1
       GROUP BY song_id ORDER BY plays DESC LIMIT ?2`,
  ).bind(since, limit).all();
  return r.results ?? [];
}

export async function topSearches(env: Env, days = 7, limit = 50) {
  const since = Date.now() - days * 86_400_000;
  const r = await env.DB.prepare(
    `SELECT query, COUNT(*) AS hits
       FROM searches WHERE ts >= ?1
       GROUP BY query ORDER BY hits DESC LIMIT ?2`,
  ).bind(since, limit).all();
  return r.results ?? [];
}

export async function recentErrors(env: Env, limit = 100) {
  const r = await env.DB.prepare(
    `SELECT route, message, ts FROM errors ORDER BY ts DESC LIMIT ?1`,
  ).bind(limit).all();
  return r.results ?? [];
}
