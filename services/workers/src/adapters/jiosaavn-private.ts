import type { SearchResult, SearchType, Song, Lang } from "@flexy/types";
import { safeJson } from "../utils/fetch";
import {
  normalizeSong, normalizeAlbum, normalizeArtist, normalizePlaylist,
} from "./normalizer";
import type { MusicAdapter } from "./types";

/** Adapter for https://jiosaavn-api-privatecv8.b4a.run/api */
const BASE = "https://jiosaavn-api-privatecv8.b4a.run/api";
const NAME = "jiosaavn-private" as const;

export const jiosaavnPrivate: MusicAdapter = {
  name: NAME,
  priority: 50,

  async search(q, type: SearchType = "all", limit = 20) {
    const data = await safeJson<any>(`${BASE}/search/all?query=${encodeURIComponent(q)}&limit=${limit}`);
    if (!data) return null;
    const d = data.data ?? data;
    const songs = (d.songs?.results ?? []).map((s: unknown) => normalizeSong(s, NAME)).filter(Boolean);
    const albums = (d.albums?.results ?? []).map((a: unknown) => normalizeAlbum(a, NAME)).filter(Boolean);
    const artists = (d.artists?.results ?? []).map((a: unknown) => normalizeArtist(a, NAME)).filter(Boolean);
    const playlists = (d.playlists?.results ?? []).map((p: unknown) => normalizePlaylist(p, NAME)).filter(Boolean);
    const result: SearchResult = {
      query: q, source: NAME,
      songs: { results: songs as Song[], total: songs.length },
      albums: { results: albums as any, total: albums.length },
      artists: { results: artists as any, total: artists.length },
      playlists: { results: playlists as any, total: playlists.length },
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
    const data = await safeJson<any>(`${BASE}/songs?id=${encodeURIComponent(id)}`);
    const raw = (data?.data ?? data)?.[0] ?? data;
    return normalizeSong(raw, NAME);
  },
  async albumById(id) {
    const data = await safeJson<any>(`${BASE}/albums?id=${encodeURIComponent(id)}`);
    return normalizeAlbum(data?.data ?? data, NAME);
  },
  async artistById(id) {
    const data = await safeJson<any>(`${BASE}/artists?id=${encodeURIComponent(id)}`);
    return normalizeArtist(data?.data ?? data, NAME);
  },
  async playlistById(id) {
    const data = await safeJson<any>(`${BASE}/playlists?id=${encodeURIComponent(id)}`);
    return normalizePlaylist(data?.data ?? data, NAME);
  },

  async trending(_lang?: Lang) {
    const lang = _lang ?? "hindi";
    const data = await safeJson<any>(`${BASE}/modules?language=${encodeURIComponent(lang)}`);
    if (!data) return null;
    const list: unknown[] = data.data?.trending?.songs ?? data.trending?.songs ?? [];
    return list.map((s) => normalizeSong(s, NAME)).filter(Boolean) as Song[];
  },

  async health() {
    const res = await safeJson(`${BASE}/search/songs?query=test&limit=1`, undefined, {
      timeoutMs: 3000, retries: 0,
    });
    return !!res;
  },
};
