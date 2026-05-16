import type {
  Song, Album, Artist, Playlist, SearchResult, SearchType, AdapterName, Lang,
} from "@flexy/types";

export interface MusicAdapter {
  name: AdapterName;
  /** Higher = preferred. Set 0 to temporarily disable. */
  priority: number;
  search(q: string, type?: SearchType, limit?: number): Promise<SearchResult | null>;
  songById(id: string): Promise<Song | null>;
  albumById(id: string): Promise<Album | null>;
  artistById(id: string): Promise<Artist | null>;
  playlistById(id: string): Promise<Playlist | null>;
  trending(lang?: Lang): Promise<Song[] | null>;
  related?(songId: string): Promise<Song[] | null>;
  lyrics?(songId: string): Promise<{ plain?: string; synced?: { time: number; text: string }[] } | null>;
  health(): Promise<boolean>;
}
