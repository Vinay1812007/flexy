import { Hono } from "hono";
import type { Env } from "../env";
import { withFallback } from "../adapters";
import { cached } from "../cache/kv";
import type { HomePayload, HomeRail, Lang, Song } from "@flexy/types";

const r = new Hono<{ Bindings: Env }>();

const SECONDARY_LANGS: Lang[] = ["hindi", "english", "telugu", "tamil", "punjabi"];

async function trendingFor(env: Env, lang: Lang): Promise<Song[]> {
  const out = await withFallback(env, (a) => a.trending(lang), (x) => !x || x.length === 0);
  return out?.value ?? [];
}

r.get("/", async (c) => {
  const lang = (c.req.query("lang") as Lang | undefined) ?? "hindi";
  const key = `home:${lang}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 30, async () => {
    // Pull in parallel for speed.
    const langsToFetch = Array.from(new Set([lang, ...SECONDARY_LANGS]));
    const results = await Promise.all(langsToFetch.map((l) => trendingFor(c.env, l)));

    const rails: HomeRail[] = [];

    // CMS-pinned hero / rail overrides (admin can pin via /admin/cms)
    const cmsHero = await c.env.CATALOG.get("cms:hero", "json") as HomePayload["hero"] | null;

    const trending = results[0] ?? [];
    if (trending.length) {
      rails.push({
        id: `trending-${lang}`,
        title: `Trending in ${cap(lang)}`,
        kind: "song",
        items: trending.slice(0, 20),
      });
    }
    for (let i = 1; i < langsToFetch.length; i++) {
      const l = langsToFetch[i]!;
      const songs = results[i] ?? [];
      if (songs.length) {
        rails.push({
          id: `lang-${l}`,
          title: `Fresh in ${cap(l)}`,
          kind: "song",
          items: songs.slice(0, 20),
        });
      }
    }

    // CMS-pinned featured playlists
    const featured = await c.env.CATALOG.get("cms:featured-playlists", "json") as any[] | null;
    if (featured?.length) {
      rails.unshift({
        id: "featured",
        title: "Editorial Picks",
        kind: "playlist",
        items: featured,
      });
    }

    const payload: HomePayload = { rails, hero: cmsHero ?? undefined };
    return payload;
  }, c.req.raw);

  return c.json({ error: false, data: value, source: "saavn-dev", cached: isCached });
});

r.get("/trending", async (c) => {
  const lang = (c.req.query("lang") as Lang | undefined) ?? "hindi";
  const key = `trending:${lang}`;
  const { value, cached: isCached } = await cached(c.env, key, 60 * 30, async () => {
    return trendingFor(c.env, lang);
  }, c.req.raw);
  return c.json({ error: false, data: value, source: "saavn-dev", cached: isCached });
});

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default r;
