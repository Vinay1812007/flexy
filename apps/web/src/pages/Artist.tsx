import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Image, ScrollRail, Skeleton } from "@flexy/ui";
import { SongList } from "../components/lists/SongList";
import { AlbumCard } from "../components/cards/AlbumCard";
import { pickCover, formatCount } from "../lib/format";

export function Artist() {
  const { id = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: () => api.artist(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-60 w-60 rounded-full" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (!data) return <p className="py-10 text-center text-flexy-mute">Artist not found.</p>;

  return (
    <div className="pt-4">
      <header className="flex flex-col gap-6 md:flex-row md:items-end">
        <Image src={pickCover(data.image)} alt={data.name} className="h-52 w-52 rounded-full shadow-2xl" />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-flexy-mute">Artist</p>
          <h1 className="font-display text-3xl font-bold md:text-5xl">{data.name}</h1>
          <p className="mt-1 text-flexy-mute">
            {formatCount(data.followerCount)} followers · {formatCount(data.fanCount)} fans
          </p>
          {data.bio ? <p className="mt-2 max-w-2xl text-sm text-flexy-mute">{data.bio}</p> : null}
        </div>
      </header>

      {data.topSongs?.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold">Top songs</h2>
          <SongList songs={data.topSongs.slice(0, 10)} />
        </section>
      ) : null}

      {data.topAlbums?.length ? (
        <ScrollRail title="Albums" className="mt-8">
          {data.topAlbums.map((a) => <AlbumCard key={a.id} album={a} />)}
        </ScrollRail>
      ) : null}
    </div>
  );
}
