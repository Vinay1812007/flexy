import { Play, Pause, SkipBack, SkipForward, Heart, ListMusic, Volume2, Shuffle, Repeat, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePlayerStore } from "../../store/player";
import { SeekBar } from "./SeekBar";
import { Image, cn } from "@flexy/ui";
import { pickCover, formatDuration } from "../../lib/format";

export function MiniPlayer() {
  const current   = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position  = usePlayerStore((s) => s.position);
  const duration  = usePlayerStore((s) => s.duration);
  const volume    = usePlayerStore((s) => s.volume);
  const shuffle   = usePlayerStore((s) => s.shuffle);
  const repeat    = usePlayerStore((s) => s.repeat);
  const liked     = usePlayerStore((s) => s.liked);

  if (!current) return null;

  const isLiked = !!liked[current.id];
  const artists = current.artists.primary.map((a) => a.name).join(", ");

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-7xl px-2 pb-2"
    >
      <div className="glass-strong rounded-2xl shadow-glass">
        <SeekBar
          current={position}
          duration={duration}
          onSeek={(s) => window.dispatchEvent(new CustomEvent("flexy:seek", { detail: s }))}
          className="rounded-t-2xl rounded-b-none"
        />
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Now playing */}
          <button
            onClick={() => usePlayerStore.getState().toggleFullScreen()}
            className="flex min-w-0 items-center gap-3"
          >
            <Image
              src={pickCover(current.image)}
              alt={current.name}
              className="h-12 w-12 flex-shrink-0 rounded-md"
            />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{current.name}</p>
              <p className="truncate text-xs text-flexy-mute">{artists}</p>
            </div>
          </button>

          {/* Controls */}
          <div className="flex flex-1 items-center justify-center gap-2">
            <IconBtn
              active={shuffle}
              onClick={() => usePlayerStore.getState().setShuffle(!shuffle)}
              ariaLabel="Shuffle"
            >
              <Shuffle size={16} />
            </IconBtn>
            <IconBtn ariaLabel="Previous" onClick={() => usePlayerStore.getState().prev()}>
              <SkipBack size={18} />
            </IconBtn>
            <button
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => usePlayerStore.getState().setPlaying(!isPlaying)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-black hover:scale-105 transition"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <IconBtn ariaLabel="Next" onClick={() => usePlayerStore.getState().next()}>
              <SkipForward size={18} />
            </IconBtn>
            <IconBtn
              active={repeat !== "off"}
              onClick={() => usePlayerStore.getState().cycleRepeat()}
              ariaLabel={`Repeat ${repeat}`}
            >
              <Repeat size={16} />
            </IconBtn>
          </div>

          {/* Right cluster */}
          <div className="hidden items-center gap-2 md:flex">
            <span className="w-24 text-right text-xs text-flexy-mute tabular-nums">
              {formatDuration(position)} / {formatDuration(duration)}
            </span>
            <IconBtn
              active={isLiked}
              onClick={() => usePlayerStore.getState().toggleLike(current)}
              ariaLabel={isLiked ? "Unlike" : "Like"}
            >
              <Heart size={16} className={isLiked ? "fill-current text-flexy-accent" : ""} />
            </IconBtn>
            <IconBtn ariaLabel="Queue">
              <ListMusic size={16} />
            </IconBtn>
            <div className="flex items-center gap-1">
              <Volume2 size={16} className="text-flexy-mute" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => usePlayerStore.getState().setVolume(parseFloat(e.target.value))}
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/10 accent-flexy-accent"
              />
            </div>
            <IconBtn ariaLabel="Open full player" onClick={() => usePlayerStore.getState().toggleFullScreen()}>
              <Maximize2 size={16} />
            </IconBtn>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children, onClick, active, ariaLabel,
}: { children: React.ReactNode; onClick?: () => void; active?: boolean; ariaLabel: string }) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full transition",
        active ? "text-flexy-accent" : "text-flexy-mute hover:text-white hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}
