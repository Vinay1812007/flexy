import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { SongList } from "../components/lists/SongList";
import { AlbumCard } from "../components/cards/AlbumCard";
import { ArtistCard } from "../components/cards/ArtistCard";
import { PlaylistCard } from "../components/cards/PlaylistCard";
import { ScrollRail, SkeletonRow } from "@flexy/ui";

export function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", q],
    queryFn: () => api.search(q, "all", 20),
    enabled: q.length > 0,
    staleTime: 30 * 1000,
  });

  if (!q) {
    return (
      <div className="py-20 text-center text-flexy-mute">
        <p className="text-lg">Find something to play.</p>
        <p className="text-sm">Try "shubh", "anirudh", "telugu hits 2024"…</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="py-10 text-center text-flexy-mute">Couldn't load results. Try again.</p>;
  }

  return (
    <div className="space-y-8 pt-4">
      <p className="text-xs text-flexy-mute">Source: {data.source}</p>

      {data.songs.results.length ? (
        <section>
          <h2 className="mb-3 text-xl font-bold">Songs</h2>
          <SongList songs={data.songs.results} />
        </section>
      ) : null}

      {data.artists.results.length ? (
        <ScrollRail title="Artists">
          {data.artists.results.map((a) => <ArtistCard key={a.id} artist={a} />)}
        </ScrollRail>
      ) : null}

      {data.albums.results.length ? (
        <ScrollRail title="Albums">
          {data.albums.results.map((a) => <AlbumCard key={a.id} album={a} />)}
        </ScrollRail>
      ) : null}

      {data.playlists.results.length ? (
        <ScrollRail title="Playlists">
          {data.playlists.results.map((p) => <PlaylistCard key={p.id} playlist={p} />)}
        </ScrollRail>
      ) : null}
    </div>
  );
}
