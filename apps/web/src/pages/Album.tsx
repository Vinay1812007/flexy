import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Image, Button, Skeleton } from "@flexy/ui";
import { SongList } from "../components/lists/SongList";
import { Play, Shuffle } from "lucide-react";
import { usePlayerStore } from "../store/player";
import { pickCover } from "../lib/format";

export function Album() {
  const { id = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["album", id],
    queryFn: () => api.album(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-60 w-60 rounded-2xl" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (!data) return <p className="py-10 text-center text-flexy-mute">Album not found.</p>;

  const playAll = () => {
    const songs = data.songs ?? [];
    if (!songs.length) return;
    usePlayerStore.getState().playSong(songs[0]!, { queue: songs.slice(1), replaceQueue: true });
  };
  const shufflePlay = () => {
    const songs = [...(data.songs ?? [])].sort(() => Math.random() - 0.5);
    if (!songs.length) return;
    usePlayerStore.getState().setShuffle(true);
    usePlayerStore.getState().playSong(songs[0]!, { queue: songs.slice(1), replaceQueue: true });
  };

  return (
    <div className="pt-4">
      <header className="flex flex-col gap-6 md:flex-row md:items-end">
        <Image src={pickCover(data.image)} alt={data.name} className="h-52 w-52 rounded-2xl shadow-2xl" />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-flexy-mute">Album</p>
          <h1 className="font-display text-3xl font-bold md:text-5xl">{data.name}</h1>
          <p className="mt-1 text-flexy-mute">
            {data.artists.map((a) => a.name).join(", ")} · {data.year ?? ""} · {data.songs?.length ?? 0} songs
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={playAll}><Play size={16} /> Play</Button>
            <Button variant="secondary" onClick={shufflePlay}><Shuffle size={14} /> Shuffle</Button>
          </div>
        </div>
      </header>

      {data.songs?.length ? (
        <div className="mt-8">
          <SongList songs={data.songs} />
        </div>
      ) : null}
    </div>
  );
}
