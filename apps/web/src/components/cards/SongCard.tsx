import type { Song } from "@flexy/types";
import { Image } from "@flexy/ui";
import { Play } from "lucide-react";
import { usePlayerStore } from "../../store/player";
import { pickCover } from "../../lib/format";

export function SongCard({ song, queue }: { song: Song; queue?: Song[] }) {
  return (
    <button
      onClick={() => usePlayerStore.getState().playSong(song, { queue, replaceQueue: true })}
      className="group w-44 flex-shrink-0 snap-start text-left transition-transform hover:-translate-y-0.5"
    >
      <div className="relative">
        <Image src={pickCover(song.image)} alt={song.name} className="aspect-square w-full rounded-xl" />
        <span className="absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-flexy-accent text-black opacity-0 shadow-lg transition group-hover:opacity-100">
          <Play size={16} className="ml-0.5" />
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-medium">{song.name}</p>
      <p className="truncate text-xs text-flexy-mute">
        {song.artists.primary.map((a) => a.name).join(", ")}
      </p>
    </button>
  );
}
