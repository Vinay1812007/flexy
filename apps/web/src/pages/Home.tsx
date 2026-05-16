import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ScrollRail, SkeletonCard } from "@flexy/ui";
import { SongCard } from "../components/cards/SongCard";
import { AlbumCard } from "../components/cards/AlbumCard";
import { ArtistCard } from "../components/cards/ArtistCard";
import { PlaylistCard } from "../components/cards/PlaylistCard";
import { usePlayerStore } from "../store/player";
import { SongList } from "../components/lists/SongList";
import type { Song, Album, Artist, Playlist } from "@flexy/types";

const LANG_TABS = [
  { key: "hindi", label: "Hindi" },
  { key: "english", label: "English" },
  { key: "telugu", label: "Telugu" },
  { key: "tamil", label: "Tamil" },
  { key: "punjabi", label: "Punjabi" },
] as const;

export function Home() {
  const recent = usePlayerStore((s) => s.recent);
  const { data, isLoading } = useQuery({
    queryKey: ["home", "hindi"],
    queryFn: () => api.home("hindi"),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-10 pt-2">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl glass p-6 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-flexy-accent">Welcome to Flexy</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
          The sound of <span className="text-grad">right now</span>.
        </h1>
        <p className="mt-2 max-w-xl text-flexy-mute">
          Trending hits, curated playlists, and AI mixes — across Hindi, Telugu, Tamil and more.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LANG_TABS.map((t) => (
            <a
              key={t.key}
              href={`#lang-${t.key}`}
              className="rounded-full bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
            >
              {t.label}
            </a>
          ))}
        </div>
      </section>

      {/* Continue listening */}
      {recent.length > 0 ? (
        <ScrollRail title="Continue listening" subtitle="Pick up where you left off">
          {recent.slice(0, 12).map((s) => <SongCard key={s.id} song={s} />)}
        </ScrollRail>
      ) : null}

      {/* Server rails */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : null}

      {data?.rails.map((rail) => (
        <ScrollRail key={rail.id} title={rail.title} subtitle={rail.subtitle}>
          {rail.items.map((item) => {
            if ((item as Song).type === "song")     return <SongCard key={item.id} song={item as Song} queue={rail.items.filter((x) => (x as Song).type === "song") as Song[]} />;
            if ((item as Album).type === "album")   return <AlbumCard key={item.id} album={item as Album} />;
            if ((item as Artist).type === "artist") return <ArtistCard key={item.id} artist={item as Artist} />;
            if ((item as Playlist).type === "playlist") return <PlaylistCard key={item.id} playlist={item as Playlist} />;
            return null;
          })}
        </ScrollRail>
      ))}

      {/* Recently played list view (denser) */}
      {recent.length > 6 ? (
        <section>
          <h2 className="mb-3 text-xl font-bold tracking-tight">Recently played</h2>
          <SongList songs={recent.slice(0, 20)} />
        </section>
      ) : null}
    </div>
  );
}
