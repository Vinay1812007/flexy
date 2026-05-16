import type {
  Song, Album, Artist, Playlist, SearchResult, SearchType,
  HomePayload, Lyrics, Lang, Mood, NLParse, ApiResponse,
} from "@flexy/types";

/**
 * Thin, framework-agnostic client used by both the user app and the admin
 * dashboard. Pass it into React Query / SWR — it returns plain promises.
 */
export class FlexyApi {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = fetch.bind(globalThis),
  ) {}

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const res = await this.fetchImpl(url, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    });

    if (!res.ok) {
      let body: unknown = null;
      try { body = await res.json(); } catch { /* ignore */ }
      const message =
        (body && typeof body === "object" && "message" in body && typeof body.message === "string")
          ? body.message
          : `HTTP ${res.status}`;
      throw new FlexyError(message, res.status, path);
    }

    const json = (await res.json()) as ApiResponse<T>;
    if ("error" in json && json.error) {
      throw new FlexyError(json.message, json.status, path);
    }
    // unwrap { data, source, cached }
    return (json as { data: T }).data;
  }

  // ── Discovery ───────────────────────────────────────────────────
  home(lang?: Lang) {
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return this.req<HomePayload>(`/home${q}`);
  }

  trending(lang?: Lang) {
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return this.req<Song[]>(`/trending${q}`);
  }

  // ── Search ──────────────────────────────────────────────────────
  search(query: string, type: SearchType = "all", limit = 20) {
    const qs = new URLSearchParams({ q: query, type, limit: String(limit) });
    return this.req<SearchResult>(`/search?${qs.toString()}`);
  }

  searchSuggest(query: string) {
    const qs = new URLSearchParams({ q: query });
    return this.req<string[]>(`/search/suggest?${qs.toString()}`);
  }

  // ── Entities ────────────────────────────────────────────────────
  song(id: string)     { return this.req<Song>(`/song/${encodeURIComponent(id)}`); }
  album(id: string)    { return this.req<Album>(`/album/${encodeURIComponent(id)}`); }
  artist(id: string)   { return this.req<Artist>(`/artist/${encodeURIComponent(id)}`); }
  playlist(id: string) { return this.req<Playlist>(`/playlist/${encodeURIComponent(id)}`); }

  // ── Auxiliary ───────────────────────────────────────────────────
  lyrics(songId: string) {
    return this.req<Lyrics>(`/lyrics/${encodeURIComponent(songId)}`);
  }

  related(songId: string) {
    return this.req<Song[]>(`/song/${encodeURIComponent(songId)}/related`);
  }

  // ── AI ──────────────────────────────────────────────────────────
  aiNextSong(history: string[]) {
    return this.req<Song>("/ai/next-song", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ history }),
    });
  }

  aiSmartQueue(queueIds: string[]) {
    return this.req<string[]>("/ai/smart-queue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ queue: queueIds }),
    });
  }

  aiPlaylist(opts: { mood?: Mood; language?: Lang; seed?: string; size?: number }) {
    return this.req<Playlist>("/ai/playlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(opts),
    });
  }

  aiNL(prompt: string) {
    return this.req<NLParse>("/ai/nl", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  }
}

export class FlexyError extends Error {
  constructor(message: string, public status: number, public path: string) {
    super(message);
    this.name = "FlexyError";
  }
}

export function createApi(baseUrl: string) {
  return new FlexyApi(baseUrl);
}
