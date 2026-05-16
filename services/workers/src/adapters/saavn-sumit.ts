import type { SearchResult, SearchType, Song, Album, Artist, Playlist, Lang } from "@flexy/types";
import { safeJson } from "../utils/fetch";
import {
  normalizeSong, normalizeAlbum, normalizeArtist, normalizePlaylist,
} from "./normalizer";
import type { MusicAdapter } from "./types";

/** Adapter for https://saavn.sumit.co/api (fork of saavn.dev) */
const BASE = "https://saavn.sumit.co/api";
const NAME = "saavn-sumit" as const;

async function unwrap<T>(url: string): Promise<T | null> {
  const json = await safeJson<{ success?: boolean; data?: T }>(url);
  if (!json) return null;
  if (json.success === false) return null;
  return json.data ?? (json as unknown as T);
}

export const saavnSumit: MusicAdapter = {
  name: NAME,
  priority: 90,

  async search(q, type: SearchType = "all", limit = 20) {
    const data = await unwrap<any>(`${BASE}/search?query=${encodeURIComponent(q)}&limit=${limit}`);
    if (!data) return null;
    const songs     = (data.songs?.results     ?? []).map((s: unknown) => normalizeSong(s, NAME)).filter(Boolean) as Song[];
    const albums    = (data.albums?.results    ?? []).map((a: unknown) => normalizeAlbum(a, NAME)).filter(Boolean) as Album[];
    const artists   = (data.artists?.results   ?? []).map((a: unknown) => normalizeArtist(a, NAME)).filter(Boolean) as Artist[];
    const playlists = (data.playlists?.results ?? []).map((p: unknown) => normalizePlaylist(p, NAME)).filter(Boolean) as Playlist[];
    const result: SearchResult = {
      query: q, source: NAME,
      songs: { results: songs, total: songs.length },
      albums: { results: albums, total: albums.length },
      artists: { results: artists, total: artists.length },
      playlists: { results: playlists, total: playlists.length },
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
    const lang = _lang ?? "hindi";
    const data = await unwrap<any>(`${BASE}/modules?language=${encodeURIComponent(lang)}`);
    if (!data) return null;
    const list: unknown[] = data.trending?.songs ?? data.charts?.[0]?.songs ?? [];
    return list.map((s) => normalizeSong(s, NAME)).filter(Boolean) as Song[];
  },

  async related(songId) {
    const data = await unwrap<any>(`${BASE}/songs/${encodeURIComponent(songId)}/suggestions?limit=20`);
    if (!Array.isArray(data)) return null;
    return data.map((s) => normalizeSong(s, NAME)).filter(Boolean) as Song[];
  },

  async lyrics(songId) {
    const data = await unwrap<any>(`${BASE}/songs/${encodeURIComponent(songId)}/lyrics`);
    if (!data?.lyrics) return null;
    return { plain: String(data.lyrics) };
  },

  async health() {
    const res = await safeJson(`${BASE}/search/songs?query=test&limit=1`, undefined, {
      timeoutMs: 3000, retries: 0,
    });
    return !!res;
  },
};
