-- Flexy D1 schema. Paste this into the Cloudflare dashboard:
--   Workers & Pages → D1 → flexy-analytics → Console → Run.
-- It is safe to run more than once (CREATE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS plays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id TEXT NOT NULL,
  song_name TEXT,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS plays_song_idx ON plays(song_id);
CREATE INDEX IF NOT EXISTS plays_ts_idx   ON plays(ts);

CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS searches_ts_idx ON searches(ts);

CREATE TABLE IF NOT EXISTS errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route TEXT NOT NULL,
  message TEXT,
  stack TEXT,
  ts INTEGER NOT NULL
);
