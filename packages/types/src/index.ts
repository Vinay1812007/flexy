/**
 * Flexy shared type contracts.
 *
 * Every upstream API (saavn.dev, sumit, nepotune, jiosaavn-private) is
 * normalized into the shapes below. The frontend and admin only ever see
 * these shapes — they have no knowledge of which upstream answered.
 */

// ─────────────────────────── Primitives ────────────────────────────

export type Lang =
  | "hindi" | "english" | "punjabi" | "telugu" | "tamil"
  | "kannada" | "malayalam" | "marathi" | "bengali" | "gujarati"
  | "bhojpuri" | "haryanvi" | "rajasthani" | "odia" | "assamese"
  | "urdu" | "unknown";

export type SearchType = "all" | "song" | "album" | "artist" | "playlist";

export interface Image {
  /** 50x50, 150x150 or 500x500 — adapter picks closest available */
  url: string;
  quality?: "50x50" | "150x150" | "500x500" | string;
}

export interface DownloadUrl {
  quality: "12kbps" | "48kbps" | "96kbps" | "160kbps" | "320kbps" | string;
  url: string;
}

export interface ArtistMini {
  id: string;
  name: string;
  /** Useful for chip rendering: "primary" | "featured" | "lyricist" | ... */
  role?: string;
  image?: Image[];
}

// ─────────────────────────── Core entities ─────────────────────────

export interface Song {
  id: string;
  name: string;
  /** Decoded HTML entities, e.g. "Tum Hi Ho" not "Tum&apos;Hi Ho" */
  type: "song";
  /** Seconds */
  duration: number;
  language: Lang;
  /** Streamable URLs ordered by quality ASC */
  downloadUrl: DownloadUrl[];
  image: Image[];
  artists: {
    primary: ArtistMini[];
    featured: ArtistMini[];
    all: ArtistMini[];
  };
  album?: {
    id: string;
    name: string;
    url?: string;
  };
  year?: number;
  releaseDate?: string;
  /** Original source for debugging */
  source: AdapterName;
  /** Optional play count from upstream */
  playCount?: number;
  /** Optional explicit flag */
  explicit?: boolean;
  /** Lyrics fetched lazily via /lyrics/:id */
  hasLyrics?: boolean;
}

export interface Album {
  id: string;
  name: string;
  type: "album";
  year?: number;
  language: Lang;
  image: Image[];
  description?: string;
  artists: ArtistMini[];
  songCount?: number;
  songs?: Song[];
  source: AdapterName;
}

export interface Artist {
  id: string;
  name: string;
  type: "artist";
  image: Image[];
  followerCount?: number;
  fanCount?: number;
  bio?: string;
  topSongs?: Song[];
  topAlbums?: Album[];
  similarArtists?: ArtistMini[];
  source: AdapterName;
}

export interface Playlist {
  id: string;
  name: string;
  type: "playlist";
  description?: string;
  image: Image[];
  songCount?: number;
  songs?: Song[];
  followerCount?: number;
  source: AdapterName;
}

// ─────────────────────────── Search ────────────────────────────────

export interface SearchResult {
  songs: { results: Song[]; total: number };
  albums: { results: Album[]; total: number };
  artists: { results: Artist[]; total: number };
  playlists: { results: Playlist[]; total: number };
  query: string;
  /** Which adapter actually answered */
  source: AdapterName;
}

// ─────────────────────────── Home ──────────────────────────────────

export interface HomeRail {
  id: string;
  /** e.g. "Trending Now", "New in Telugu" */
  title: string;
  subtitle?: string;
  /** "song" rails are vertical card grids; "album"/"playlist"/"artist" too */
  kind: "song" | "album" | "playlist" | "artist";
  items: Array<Song | Album | Playlist | Artist>;
}

export interface HomePayload {
  rails: HomeRail[];
  hero?: {
    image: Image[];
    title: string;
    subtitle?: string;
    cta?: { label: string; href: string };
  };
}

// ─────────────────────────── Lyrics ────────────────────────────────

export interface LyricLine {
  /** Seconds offset within the song */
  time: number;
  text: string;
}

export interface Lyrics {
  songId: string;
  plain?: string;
  /** Time-aligned lines for karaoke mode; empty when unavailable */
  synced: LyricLine[];
  copyright?: string;
  source: AdapterName | "external";
}

// ─────────────────────────── AI ────────────────────────────────────

export type Mood =
  | "happy" | "sad" | "romantic" | "energetic"
  | "chill" | "workout" | "focus" | "party" | "devotional" | "unknown";

export interface NLParse {
  intent: "play" | "search" | "queue" | "create_playlist";
  filters: {
    mood?: Mood;
    language?: Lang;
    artist?: string;
    decade?: string;
  };
  query: string;
}

// ─────────────────────────── Plumbing ──────────────────────────────

export type AdapterName =
  | "saavn-dev"
  | "saavn-sumit"
  | "nepotune"
  | "jiosaavn-private";

export interface ApiError {
  error: true;
  code: string;
  message: string;
  status: number;
}

export type ApiResponse<T> =
  | { error: false; data: T; source: AdapterName; cached: boolean }
  | ApiError;
