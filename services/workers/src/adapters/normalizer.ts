import type {
  Song, Album, Artist, Playlist, ArtistMini,
  Image, DownloadUrl, Lang, AdapterName,
} from "@flexy/types";

/**
 * Helpers to coerce arbitrary upstream payloads into the normalized shape.
 * Every adapter funnels its output through these.
 */

const LANGS: Lang[] = [
  "hindi","english","punjabi","telugu","tamil","kannada","malayalam",
  "marathi","bengali","gujarati","bhojpuri","haryanvi","rajasthani",
  "odia","assamese","urdu",
];

export function normalizeLang(input: unknown): Lang {
  if (typeof input !== "string") return "unknown";
  const v = input.toLowerCase().trim();
  return (LANGS as string[]).includes(v) ? (v as Lang) : "unknown";
}

export function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function normalizeImage(input: unknown): Image[] {
  if (!input) return [];
  if (typeof input === "string") return [{ url: input }];
  if (Array.isArray(input)) {
    return input
      .map((x): Image | null => {
        if (typeof x === "string") return { url: x };
        if (x && typeof x === "object") {
          const o = x as Record<string, unknown>;
          const url = (o.link ?? o.url ?? o.image) as string | undefined;
          const quality = (o.quality ?? o.size) as string | undefined;
          if (!url) return null;
          return { url, quality };
        }
        return null;
      })
      .filter((x): x is Image => !!x);
  }
  return [];
}

export function normalizeDownloadUrl(input: unknown): DownloadUrl[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x): DownloadUrl | null => {
      if (!x || typeof x !== "object") return null;
      const o = x as Record<string, unknown>;
      const url = (o.link ?? o.url) as string | undefined;
      const quality = (o.quality ?? o.bitrate) as string | undefined;
      if (!url || !quality) return null;
      return { quality, url };
    })
    .filter((x): x is DownloadUrl => !!x)
    .sort((a, b) => (parseInt(a.quality) || 0) - (parseInt(b.quality) || 0));
}

export function normalizeArtistMini(input: unknown): ArtistMini[] {
  if (!input) return [];
  if (typeof input === "string") {
    return input.split(",").map((name, i) => ({
      id: `name:${name.trim()}-${i}`,
      name: decodeHtml(name.trim()),
    }));
  }
  if (Array.isArray(input)) {
    return input
      .map((x): ArtistMini | null => {
        if (!x || typeof x !== "object") return null;
        const o = x as Record<string, unknown>;
        if (typeof o.name !== "string") return null;
        return {
          id: String(o.id ?? `name:${o.name}`),
          name: decodeHtml(o.name),
          role: typeof o.role === "string" ? o.role : undefined,
          image: normalizeImage(o.image),
        };
      })
      .filter((x): x is ArtistMini => !!x);
  }
  return [];
}

export function normalizeSong(raw: unknown, source: AdapterName): Song | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, any>;

  const id = String(o.id ?? "");
  const name = typeof o.name === "string" ? decodeHtml(o.name) : (typeof o.title === "string" ? decodeHtml(o.title) : "");
  if (!id || !name) return null;

  const duration = Number(o.duration ?? 0);
  const lang = normalizeLang(o.language);
  const image = normalizeImage(o.image ?? o.images);
  const downloadUrl = normalizeDownloadUrl(o.downloadUrl ?? o.media_url ?? o.download_url);

  const artistsRaw =
    o.artists?.primary ??
    o.primaryArtists ??
    o.primary_artists ??
    o.singers ??
    o.artists ??
    [];
  const primary = normalizeArtistMini(artistsRaw);
  const featured = normalizeArtistMini(o.artists?.featured ?? o.featuredArtists ?? []);
  const all = normalizeArtistMini(o.artists?.all ?? o.artistsAll ?? [...primary, ...featured]);

  const album = o.album
    ? {
        id: String(o.album.id ?? o.albumid ?? ""),
        name: typeof o.album.name === "string" ? decodeHtml(o.album.name) : (typeof o.album === "string" ? decodeHtml(o.album) : ""),
        url: typeof o.album.url === "string" ? o.album.url : undefined,
      }
    : undefined;

  return {
    id,
    name,
    type: "song",
    duration: isFinite(duration) ? duration : 0,
    language: lang,
    downloadUrl,
    image,
    artists: { primary, featured, all },
    album: album?.name ? album : undefined,
    year: o.year ? Number(o.year) : undefined,
    releaseDate: typeof o.releaseDate === "string" ? o.releaseDate : undefined,
    playCount: o.playCount ? Number(o.playCount) : undefined,
    explicit: !!o.explicitContent,
    hasLyrics: !!o.hasLyrics,
    source,
  };
}

export function normalizeAlbum(raw: unknown, source: AdapterName): Album | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, any>;
  const id = String(o.id ?? "");
  const name = typeof o.name === "string" ? decodeHtml(o.name) : "";
  if (!id || !name) return null;
  return {
    id,
    name,
    type: "album",
    year: o.year ? Number(o.year) : undefined,
    language: normalizeLang(o.language),
    image: normalizeImage(o.image ?? o.images),
    description: typeof o.description === "string" ? decodeHtml(o.description) : undefined,
    artists: normalizeArtistMini(o.artists?.primary ?? o.artists ?? o.primaryArtists),
    songCount: o.songCount ? Number(o.songCount) : (Array.isArray(o.songs) ? o.songs.length : undefined),
    songs: Array.isArray(o.songs)
      ? o.songs.map((s: unknown) => normalizeSong(s, source)).filter((s): s is Song => !!s)
      : undefined,
    source,
  };
}

export function normalizeArtist(raw: unknown, source: AdapterName): Artist | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, any>;
  const id = String(o.id ?? "");
  const name = typeof o.name === "string" ? decodeHtml(o.name) : "";
  if (!id || !name) return null;
  return {
    id,
    name,
    type: "artist",
    image: normalizeImage(o.image ?? o.images),
    followerCount: o.followerCount ? Number(o.followerCount) : undefined,
    fanCount: o.fanCount ? Number(o.fanCount) : undefined,
    bio: typeof o.bio === "string" ? decodeHtml(o.bio) : undefined,
    topSongs: Array.isArray(o.topSongs)
      ? o.topSongs.map((s: unknown) => normalizeSong(s, source)).filter((s): s is Song => !!s)
      : undefined,
    topAlbums: Array.isArray(o.topAlbums)
      ? o.topAlbums.map((a: unknown) => normalizeAlbum(a, source)).filter((a): a is Album => !!a)
      : undefined,
    similarArtists: Array.isArray(o.similarArtists) ? normalizeArtistMini(o.similarArtists) : undefined,
    source,
  };
}

export function normalizePlaylist(raw: unknown, source: AdapterName): Playlist | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, any>;
  const id = String(o.id ?? "");
  const name = typeof o.name === "string" ? decodeHtml(o.name) : "";
  if (!id || !name) return null;
  return {
    id,
    name,
    type: "playlist",
    description: typeof o.description === "string" ? decodeHtml(o.description) : undefined,
    image: normalizeImage(o.image ?? o.images),
    songCount: o.songCount ? Number(o.songCount) : (Array.isArray(o.songs) ? o.songs.length : undefined),
    songs: Array.isArray(o.songs)
      ? o.songs.map((s: unknown) => normalizeSong(s, source)).filter((s): s is Song => !!s)
      : undefined,
    followerCount: o.followerCount ? Number(o.followerCount) : undefined,
    source,
  };
}
