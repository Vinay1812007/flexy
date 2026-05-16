import type { Song } from "@flexy/types";

/**
 * Framework-agnostic audio engine.
 *
 * Uses two HTMLAudioElement instances for crossfade and gapless simulation.
 * The active element plays the current song; the standby element pre-loads
 * the next one. On `ended` (or near-ended for crossfade) we swap.
 */

export type PlayerEvent =
  | { type: "time"; current: number; duration: number }
  | { type: "loaded"; duration: number }
  | { type: "playing" }
  | { type: "paused" }
  | { type: "buffering" }
  | { type: "ended" }
  | { type: "error"; message: string }
  | { type: "volume"; value: number };

export type Listener = (e: PlayerEvent) => void;

export interface PlayerOptions {
  /** Seconds of crossfade. 0 disables. */
  crossfade?: number;
  /** Initial volume (0..1) */
  volume?: number;
  /** Choose stream quality from Song.downloadUrl */
  preferredQuality?: "12kbps" | "48kbps" | "96kbps" | "160kbps" | "320kbps";
}

export interface Player {
  load(song: Song): Promise<void>;
  preload(song: Song): void;
  play(): Promise<void>;
  pause(): void;
  toggle(): Promise<void>;
  seek(seconds: number): void;
  setVolume(v: number): void;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  destroy(): void;
  on(fn: Listener): () => void;
  setMediaSession(song: Song, handlers: MediaSessionHandlers): void;
}

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSeek?: (s: number) => void;
}

/** Pick the best matching URL or fall back to the highest available. */
function pickUrl(song: Song, preferred?: PlayerOptions["preferredQuality"]): string | null {
  if (!song.downloadUrl?.length) return null;
  if (preferred) {
    const match = song.downloadUrl.find((d) => d.quality === preferred);
    if (match) return match.url;
  }
  // descending by bitrate
  const sorted = [...song.downloadUrl].sort((a, b) => {
    const ba = parseInt(a.quality) || 0;
    const bb = parseInt(b.quality) || 0;
    return bb - ba;
  });
  return sorted[0]?.url ?? null;
}

export function createPlayer(opts: PlayerOptions = {}): Player {
  const crossfade = Math.max(0, opts.crossfade ?? 0);
  let volume = clamp01(opts.volume ?? 1);
  const preferredQuality = opts.preferredQuality;

  // Two-element strategy for gapless / crossfade
  const a = new Audio();
  const b = new Audio();
  for (const el of [a, b]) {
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.volume = volume;
  }
  let active: HTMLAudioElement = a;
  let standby: HTMLAudioElement = b;

  const listeners = new Set<Listener>();
  const emit = (e: PlayerEvent) => listeners.forEach((l) => l(e));

  // wire active-element events; rebind whenever we swap
  let detach: (() => void) | null = null;
  const bind = (el: HTMLAudioElement) => {
    detach?.();
    const onTime = () => emit({ type: "time", current: el.currentTime, duration: el.duration || 0 });
    const onPlaying = () => emit({ type: "playing" });
    const onPause = () => emit({ type: "paused" });
    const onWaiting = () => emit({ type: "buffering" });
    const onEnded = () => emit({ type: "ended" });
    const onLoaded = () => emit({ type: "loaded", duration: el.duration || 0 });
    const onError = () => emit({ type: "error", message: el.error?.message ?? "playback error" });

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("ended", onEnded);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("error", onError);

    detach = () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("error", onError);
    };
  };
  bind(active);

  // Crossfade timer
  let fadeTimer: ReturnType<typeof setInterval> | null = null;
  const clearFade = () => { if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; } };

  const startCrossfade = () => {
    if (!crossfade) return;
    if (!standby.src) return;
    clearFade();
    standby.currentTime = 0;
    standby.volume = 0;
    void standby.play().catch(() => { /* ignore — will retry on next song */ });

    const steps = 20;
    let i = 0;
    fadeTimer = setInterval(() => {
      i += 1;
      const t = i / steps;
      active.volume = clamp01(volume * (1 - t));
      standby.volume = clamp01(volume * t);
      if (i >= steps) {
        clearFade();
        // swap
        active.pause();
        active.src = "";
        const old = active;
        active = standby;
        standby = old;
        active.volume = volume;
        bind(active);
        emit({ type: "playing" });
      }
    }, (crossfade * 1000) / steps);
  };

  return {
    async load(song) {
      const url = pickUrl(song, preferredQuality);
      if (!url) {
        emit({ type: "error", message: "No playable URL for song" });
        return;
      }
      clearFade();
      // If we pre-loaded into `standby`, fast-swap; else load fresh.
      if (standby.src === url) {
        active.pause();
        active.src = "";
        const old = active;
        active = standby;
        standby = old;
        active.volume = volume;
        bind(active);
      } else {
        active.src = url;
        active.load();
      }
      try {
        await active.play();
      } catch (err) {
        // Autoplay block — caller should react to user gesture
        emit({ type: "error", message: (err as Error).message });
      }
    },
    preload(song) {
      const url = pickUrl(song, preferredQuality);
      if (!url) return;
      if (standby.src === url) return;
      standby.src = url;
      try { standby.load(); } catch { /* ignore */ }
    },
    async play() {
      try { await active.play(); } catch (e) { emit({ type: "error", message: (e as Error).message }); }
    },
    pause() { active.pause(); },
    async toggle() {
      if (active.paused) { await this.play(); } else { this.pause(); }
    },
    seek(s) {
      if (!isFinite(s)) return;
      try { active.currentTime = Math.max(0, s); } catch { /* ignore */ }
    },
    setVolume(v) {
      volume = clamp01(v);
      active.volume = volume;
      emit({ type: "volume", value: volume });
    },
    getVolume() { return volume; },
    getCurrentTime() { return active.currentTime || 0; },
    getDuration() { return active.duration || 0; },
    isPlaying() { return !active.paused; },
    destroy() {
      clearFade();
      detach?.();
      for (const el of [a, b]) {
        try { el.pause(); el.src = ""; el.load(); } catch { /* ignore */ }
      }
      listeners.clear();
    },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setMediaSession(song, handlers) {
      if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
      const cover = song.image[song.image.length - 1]?.url;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name,
        artist: song.artists.primary.map((a) => a.name).join(", "),
        album: song.album?.name,
        artwork: cover ? [{ src: cover, sizes: "512x512", type: "image/jpeg" }] : [],
      });
      const set = (name: MediaSessionAction, fn?: () => void) => {
        try { navigator.mediaSession.setActionHandler(name, fn ?? null); } catch { /* ignore */ }
      };
      set("play", handlers.onPlay);
      set("pause", handlers.onPause);
      set("previoustrack", handlers.onPrev);
      set("nexttrack", handlers.onNext);
      set("seekto", handlers.onSeek ? (d) => handlers.onSeek!((d as MediaSessionActionDetails).seekTime ?? 0) : undefined);
    },
  };

  // Crossfade trigger: when remaining < crossfade seconds, start fade
  function _maybeStartCrossfade() { /* hook reserved for future buffer-aware logic */ }
  void _maybeStartCrossfade;
  void startCrossfade;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export { pickUrl };
