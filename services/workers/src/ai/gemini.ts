import type { Env } from "../env";
import type { NLParse, Mood, Lang } from "@flexy/types";

const MODEL = "gemini-1.5-flash";

/**
 * Minimal Gemini REST wrapper. JSON-mode by default — we coerce structured
 * outputs out of the model via `responseMimeType: "application/json"`.
 */
async function generate(
  env: Env,
  prompt: string,
  schemaHint?: string,
): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: schemaHint ? `${prompt}\n\nReturn ONLY valid JSON matching: ${schemaHint}` : prompt }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    clearTimeout(t);
    return null;
  }
}

/** Parse a natural-language command into a search query + filters. */
export async function nlParse(env: Env, prompt: string): Promise<NLParse | null> {
  const text = await generate(
    env,
    `You are a music intent parser. Given the user request "${prompt}",
return JSON with: intent (play|search|queue|create_playlist),
filters (mood, language, artist, decade) and query (a clean search string).`,
    `{"intent":"play","filters":{"mood":"sad","language":"telugu"},"query":"sad telugu"}`,
  );
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as NLParse;
    return parsed;
  } catch {
    return null;
  }
}

/** Pick the next song ID given a recent play history (song ids/titles). */
export async function predictNextSongId(env: Env, history: string[]): Promise<string | null> {
  const text = await generate(
    env,
    `Recent songs played: ${history.slice(-15).join(" | ")}.
Suggest ONE song title that fits this listening session as a JSON object {"query":"..."}.`,
    `{"query":"<song title or 'artist - title'>"}`,
  );
  if (!text) return null;
  try {
    const o = JSON.parse(text) as { query?: string };
    return typeof o.query === "string" ? o.query : null;
  } catch {
    return null;
  }
}

/** Reorder a queue (by id) for better vibe coherence. */
export async function smartReorder(env: Env, ids: string[]): Promise<string[] | null> {
  if (ids.length <= 2) return ids;
  const text = await generate(
    env,
    `Reorder these song ids by smooth vibe transitions (tempo + mood): ${ids.join(",")}.
Return JSON {"order":["id1","id2",...]} using only the provided ids.`,
    `{"order":["id1","id2"]}`,
  );
  if (!text) return null;
  try {
    const o = JSON.parse(text) as { order?: string[] };
    if (!Array.isArray(o.order)) return null;
    // sanitize — keep only ids that were in the input, preserve uniqueness
    const set = new Set(ids);
    const out = o.order.filter((x) => set.has(x));
    // append any missing originals in their original order
    for (const id of ids) if (!out.includes(id)) out.push(id);
    return out;
  } catch {
    return null;
  }
}

/** Generate a playlist concept (set of search queries) from mood/lang/seed. */
export async function generatePlaylist(env: Env, opts: { mood?: Mood; language?: Lang; seed?: string; size?: number }) {
  const size = Math.min(opts.size ?? 20, 50);
  const text = await generate(
    env,
    `Build a playlist of ${size} songs.
Mood: ${opts.mood ?? "any"}.
Language: ${opts.language ?? "any"}.
Seed/Inspiration: ${opts.seed ?? "none"}.
Return JSON: {"title":"...","description":"...","queries":["artist - title", ...]}.`,
    `{"title":"...","description":"...","queries":["..."]}`,
  );
  if (!text) return null;
  try {
    return JSON.parse(text) as { title: string; description: string; queries: string[] };
  } catch {
    return null;
  }
}
