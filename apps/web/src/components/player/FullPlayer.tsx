import { motion } from "framer-motion";
import { X, Play, Pause, SkipBack, SkipForward, ListMusic, Heart } from "lucide-react";
import { usePlayerStore } from "../../store/player";
import { Image } from "@flexy/ui";
import { SeekBar } from "./SeekBar";
import { pickCover, formatDuration } from "../../lib/format";
import { LyricsPanel } from "./LyricsPanel";
import { QueuePanel } from "./QueuePanel";
import { useState } from "react";

type Tab = "lyrics" | "queue";

export function FullPlayer() {
  const current   = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position  = usePlayerStore((s) => s.position);
  const duration  = usePlayerStore((s) => s.duration);
  const liked     = usePlayerStore((s) => s.liked);
  const [tab, setTab] = useState<Tab>("lyrics");

  if (!current) return null;
  const isLiked = !!liked[current.id];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-flexy-bg/95 backdrop-blur-2xl"
    >
      {/* Ambient color from cover */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(34,231,162,.4), transparent 50%), radial-gradient(circle at 70% 80%, rgba(6,212,206,.4), transparent 50%)`,
        }}
      />
      <button
        onClick={() => usePlayerStore.getState().toggleFullScreen()}
        aria-label="Close"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
      >
        <X size={18} />
      </button>

      <div className="mx-auto grid h-full max-w-6xl grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-12">
        {/* Cover + meta */}
        <div className="flex flex-col items-center justify-center gap-6 md:items-start">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="aspect-square w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
          >
            <Image src={pickCover(current.image)} alt={current.name} className="h-full w-full" />
          </motion.div>

          <div className="w-full max-w-md text-center md:text-left">
            <h1 className="text-3xl font-display font-bold tracking-tight">{current.name}</h1>
            <p className="mt-1 text-flexy-mute">
              {current.artists.primary.map((a) => a.name).join(", ")}
              {current.album?.name ? ` — ${current.album.name}` : ""}
            </p>
          </div>

          <div className="w-full max-w-md">
            <SeekBar
              current={position}
              duration={duration}
              onSeek={(s) => window.dispatchEvent(new CustomEvent("flexy:seek", { detail: s }))}
            />
            <div className="mt-2 flex justify-between text-xs text-flexy-mute tabular-nums">
              <span>{formatDuration(position)}</span>
              <span>-{formatDuration(Math.max(0, duration - position))}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label={isLiked ? "Unlike" : "Like"}
              onClick={() => usePlayerStore.getState().toggleLike(current)}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/5 hover:bg-white/10"
            >
              <Heart size={20} className={isLiked ? "fill-flexy-accent text-flexy-accent" : ""} />
            </button>
            <button
              aria-label="Previous"
              onClick={() => usePlayerStore.getState().prev()}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/5 hover:bg-white/10"
            >
              <SkipBack size={20} />
            </button>
            <button
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => usePlayerStore.getState().setPlaying(!isPlaying)}
              className="grid h-16 w-16 place-items-center rounded-full bg-white text-black hover:scale-105 transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <button
              aria-label="Next"
              onClick={() => usePlayerStore.getState().next()}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/5 hover:bg-white/10"
            >
              <SkipForward size={20} />
            </button>
            <button
              aria-label="Queue"
              onClick={() => setTab("queue")}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/5 hover:bg-white/10"
            >
              <ListMusic size={20} />
            </button>
          </div>
        </div>

        {/* Lyrics / queue */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex gap-2">
            {(["lyrics", "queue"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "rounded-full px-4 py-1.5 text-xs uppercase tracking-wider " +
                  (tab === t ? "bg-white/15 text-white" : "bg-white/5 text-flexy-mute hover:text-white")
                }
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden rounded-2xl glass p-4">
            {tab === "lyrics" ? <LyricsPanel songId={current.id} /> : <QueuePanel />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
