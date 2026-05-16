import type { SearchResult, SearchType, Song, Album, Artist, Playlist, Lang } from "@flexy/types";
import { safeJson } from "../utils/fetch";
import {
  normalizeSong, normalizeAlbum, normalizeArtist, normalizePlaylist,
} from "./normalizer";
import type { MusicAdapter } from "./types";

/**
 * Adapter for https://saavn.dev/api  (the most stable mirror)
 * Docs: https://saavn.dev/docs
 */
const BASE = "https://saavn.dev/api";
const NAME = "saavn-dev" as const;

async function unwrap<T>(url: string): Promise<T | null> {
  const json = await safeJson<{ success?: boolean; data?: T }>(url);
  if (!json) return null;
  if (json.success === false) return null;
  return (json.data ?? (json as unknown as T));
}

export const saavnDev: MusicAdapter = {
  name: NAME,
  priority: 100,

  async search(q, type: SearchType = "all", limit = 20) {
    const data = await unwrap<any>(`${BASE}/search?query=${encodeURIComponent(q)}&limit=${limit}`);
    if (!data) return null;
    const songsList = (data.songs?.results ?? []).map((s: unknown) => normalizeSong(s, NAME)).filter(Boolean);
    const albumsList = (data.albums?.results ?? []).map((a: unknown) => normalizeAlbum(a, NAME)).filter(Boolean);
    const artistsList = (data.artists?.results ?? []).map((a: unknown) => normalizeArtist(a, NAME)).filter(Boolean);
    const playlistsList = (data.playlists?.results ?? []).map((p: unknown) => normalizePlaylist(p, NAME)).filter(Boolean);
    const result: SearchResult = {
      query: q,
      source: NAME,
      songs:     { results: songsList     as Song[],     total: songsList.length },
      albums:    { results: albumsList    as Album[],    total: albumsList.length },
      artists:   { results: artistsList   as Artist[],   total: artistsList.length },
      playlists: { results: playlistsList as Playlist[], total: playlistsList.length },
    };
    if (type !== "all") {
      const empty = { results: [], total: 0 };
      if (type !== "song") result.songs = empty;
      if (type !== "album") result.albums = empty;
      if (type !== "artist") result.artists = empty;
      if (type !== "playlist") result.playlists = empty;
    }
    return result;
  },

  async songById(id) {
    const data = await unwrap<any>(`${BASE}/songs/${encodeURIComponent(id)}`);
    const raw = Array.isArray(data) ? data[0] : data?.songs?.[0] ?? data;
    return normalizeSong(raw, NAME);
  },

  async albumById(id) {
    const data = await unwrap<any>(`${BASE}/albums?id=${encodeURIComponent(id)}`);
    return normalizeAlbum(data, NAME);
  },

  async artistById(id) {
    const data = await unwrap<any>(`${BASE}/artists?id=${encodeURIComponent(id)}`);
    return normalizeArtist(data, NAME);
  },

  async playlistById(id) {
    const data = await unwrap<any>(`${BASE}/playlists?id=${encodeURIComponent(id)}`);
    return normalizePlaylist(data, NAME);
  },

  async trending(_lang?: Lang) {
    // saavn.dev exposes /modules?language=…
    const lang = _lang ?? "hindi";
    const data = await unwrap<any>(`${BASE}/modules?language=${encodeURIComponent(lang)}`);
    if (!data) return null;
    const candidates: unknown[] =
      data.trending?.songs ??
      data.trending?.data ??
      data.charts?.[0]?.songs ??
      [];
    return (candidates.map((s) => normalizeSong(s, NAME)).filter(Boolean)) as Song[];
  },

  async related(songId) {
    const data = await unwrap<any>(`${BASE}/songs/${encodeURIComponent(songId)}/suggestions?limit=20`);
    if (!Array.isArray(data)) return null;
    return data.map((s) => normalizeSong(s, NAME)).filter(Boolean) as Song[];
  },

  async lyrics(songId) {
    const data = await unwrap<any>(`${BASE}/songs/${encodeURIComponent(songId)}/lyrics`);
    if (!data || !data.lyrics) return null;
    return { plain: String(data.lyrics) };
  },

  async health() {
    const res = await safeJson<{ success?: boolean }>(`${BASE}/search/songs?query=test&limit=1`, undefined, {
      timeoutMs: 3000, retries: 0,
    });
    return !!res;
  },
};
