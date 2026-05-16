import { useEffect, useRef } from "react";
import { createPlayer, type Player } from "@flexy/player";
import { usePlayerStore } from "../store/player";
import { api } from "../lib/api";

/**
 * Singleton hook that mounts the audio engine and wires it to Zustand.
 * Mount once at the top of the layout — never again.
 */
export function useAudio() {
  const playerRef = useRef<Player | null>(null);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);

  useEffect(() => {
    const p = createPlayer({ crossfade: 0, volume });
    playerRef.current = p;

    const off = p.on(async (e) => {
      switch (e.type) {
        case "time":
          usePlayerStore.getState().setPosition(e.current);
          if (e.duration && Math.abs(e.duration - usePlayerStore.getState().duration) > 0.5) {
            usePlayerStore.getState().setDuration(e.duration);
          }
          break;
        case "loaded":
          usePlayerStore.getState().setDuration(e.duration);
          break;
        case "playing":
          usePlayerStore.getState().setPlaying(true);
          usePlayerStore.getState().setBuffering(false);
          break;
        case "paused":
          usePlayerStore.getState().setPlaying(false);
          break;
        case "buffering":
          usePlayerStore.getState().setBuffering(true);
          break;
        case "ended": {
          const next = usePlayerStore.getState().next();
          // If queue empty, fetch one via AI / related as fallback
          if (!next) {
            const cur = usePlayerStore.getState().current;
            if (cur) {
              try {
                const related = await api.related(cur.id);
                if (related[0]) usePlayerStore.getState().playSong(related[0]);
              } catch { /* swallow */ }
            }
          }
          break;
        }
        case "error":
          usePlayerStore.getState().setBuffering(false);
          // Best effort: skip to next on hard playback error
          usePlayerStore.getState().next();
          break;
      }
    });

    return () => {
      off();
      p.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load song when `current` changes
  useEffect(() => {
    const p = playerRef.current;
    if (!p || !current) return;
    void p.load(current);
    p.setMediaSession(current, {
      onPlay:  () => usePlayerStore.getState().setPlaying(true),
      onPause: () => usePlayerStore.getState().setPlaying(false),
      onPrev:  () => usePlayerStore.getState().prev(),
      onNext:  () => usePlayerStore.getState().next(),
      onSeek:  (s) => p.seek(s),
    });
  }, [current]);

  // Play / pause reactivity
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying && !p.isPlaying()) void p.play();
    if (!isPlaying && p.isPlaying()) p.pause();
  }, [isPlaying]);

  // Volume reactivity
  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  return {
    seek: (s: number) => playerRef.current?.seek(s),
  };
}
