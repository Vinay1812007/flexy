import type { Song } from "@flexy/types";
import { Play, Heart, Plus } from "lucide-react";
import { usePlayerStore } from "../../store/player";
import { Image, cn } from "@flexy/ui";
import { pickCover, formatDuration } from "../../lib/format";

interface Props {
  songs: Song[];
  /** All songs become the queue when one is played. */
  asQueue?: boolean;
  className?: string;
}

export function SongList({ songs, asQueue = true, className }: Props) {
  const current = usePlayerStore((s) => s.current);
  const liked = usePlayerStore((s) => s.liked);

  return (
    <ul className={cn("divide-y divide-flexy-line", className)}>
      {songs.map((s, i) => {
        const isActive = current?.id === s.id;
        const isLiked = !!liked[s.id];
        return (
          <li
            key={`${s.id}-${i}`}
            className={cn(
              "group flex items-center gap-3 px-2 py-2 rounded transition-colors",
              isActive ? "bg-white/10" : "hover:bg-white/5",
            )}
          >
            <button
              onClick={() =>
                usePlayerStore.getState().playSong(s, { queue: asQueue ? songs.slice(i + 1) : undefined, replaceQueue: true })
              }
              className="relative"
              aria-label={`Play ${s.name}`}
            >
              <Image src={pickCover(s.image)} alt={s.name} className="h-12 w-12 rounded" />
              <span className="absolute inset-0 grid place-items-center rounded bg-black/40 opacity-0 transition group-hover:opacity-100">
                <Play size={16} className="text-white ml-0.5" />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm", isActive ? "text-flexy-accent" : "")}>{s.name}</p>
              <p className="truncate text-xs text-flexy-mute">
                {s.artists.primary.map((a) => a.name).join(", ")}
              </p>
            </div>
            <button
              onClick={() => usePlayerStore.getState().enqueue(s)}
              aria-label="Add to queue"
              className="opacity-0 group-hover:opacity-100 transition text-flexy-mute hover:text-white"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => usePlayerStore.getState().toggleLike(s)}
              aria-label={isLiked ? "Unlike" : "Like"}
              className={cn(
                "transition",
                isLiked ? "text-flexy-accent" : "text-flexy-mute opacity-0 group-hover:opacity-100 hover:text-white",
              )}
            >
              <Heart size={16} className={isLiked ? "fill-current" : ""} />
            </button>
            <span className="hidden w-12 text-right text-xs text-flexy-mute tabular-nums md:inline">
              {formatDuration(s.duration)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
