import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../env";
import { rateLimit } from "../middleware/ratelimit";
import { nlParse, predictNextSongId, smartReorder, generatePlaylist } from "../ai/gemini";
import { withFallback } from "../adapters";
import type { Playlist, Song } from "@flexy/types";

const r = new Hono<{ Bindings: Env }>();

// Tighter per-IP limits for AI — Gemini calls cost money.
r.use("*", rateLimit("ai", 10, 60));

r.post("/nl", async (c) => {
  const body = await c.req.json().catch(() => null);
  const p = z.object({ prompt: z.string().min(1).max(200) }).safeParse(body);
  if (!p.success) return c.json({ error: true, code: "bad_request", message: p.error.message, status: 400 }, 400);
  const parsed = await nlParse(c.env, p.data.prompt);
  if (!parsed) return c.json({ error: true, code: "ai_failed", message: "Unable to parse intent", status: 502 }, 502);
  return c.json({ error: false, data: parsed, source: "saavn-dev", cached: false });
});

r.post("/next-song", async (c) => {
  const body = await c.req.json().catch(() => null);
  const p = z.object({ history: z.array(z.string()).max(50) }).safeParse(body);
  if (!p.success) return c.json({ error: true, code: "bad_request", message: p.error.message, status: 400 }, 400);
  const query = await predictNextSongId(c.env, p.data.history);
  if (!query) return c.json({ error: true, code: "ai_failed", message: "No prediction", status: 502 }, 502);
  // Resolve the AI's text suggestion to an actual playable Song
  const search = await withFallback(c.env, (a) => a.search(query, "song", 1), (r) => !r || r.songs.results.length === 0);
  const song = search?.value.songs.results[0];
  if (!song) return c.json({ error: true, code: "not_found", message: "AI suggested an unfindable song", status: 404 }, 404);
  return c.json({ error: false, data: song as Song, source: song.source, cached: false });
});

r.post("/smart-queue", async (c) => {
  const body = await c.req.json().catch(() => null);
  const p = z.object({ queue: z.array(z.string()).min(1).max(50) }).safeParse(body);
  if (!p.success) return c.json({ error: true, code: "bad_request", message: p.error.message, status: 400 }, 400);
  const ordered = await smartReorder(c.env, p.data.queue);
  if (!ordered) return c.json({ error: true, code: "ai_failed", message: "Reorder failed", status: 502 }, 502);
  return c.json({ error: false, data: ordered, source: "saavn-dev", cached: false });
});

r.post("/playlist", async (c) => {
  const body = await c.req.json().catch(() => null);
  const p = z.object({
    mood: z.string().optional(),
    language: z.string().optional(),
    seed: z.string().optional(),
    size: z.number().int().min(5).max(50).optional(),
  }).safeParse(body);
  if (!p.success) return c.json({ error: true, code: "bad_request", message: p.error.message, status: 400 }, 400);

  const concept = await generatePlaylist(c.env, p.data as any);
  if (!concept) return c.json({ error: true, code: "ai_failed", message: "Could not generate playlist", status: 502 }, 502);

  // Resolve each query to one real Song
  const songs: Song[] = [];
  for (const q of concept.queries) {
    const out = await withFallback(c.env, (a) => a.search(q, "song", 1), (r) => !r || r.songs.results.length === 0);
    const s = out?.value.songs.results[0];
    if (s) songs.push(s);
  }

  const playlist: Playlist = {
    id: `ai-${Date.now()}`,
    type: "playlist",
    name: concept.title,
    description: concept.description,
    image: songs[0]?.image ?? [],
    songCount: songs.length,
    songs,
    source: "saavn-dev",
  };
  return c.json({ error: false, data: playlist, source: "saavn-dev", cached: false });
});

export default r;
