import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Song } from "@flexy/types";

type Repeat = "off" | "one" | "all";

interface PlayerState {
  // Player
  current: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  buffering: boolean;
  fullScreen: boolean;

  // Queue
  queue: Song[];          // upcoming
  history: Song[];        // previously played
  shuffle: boolean;
  repeat: Repeat;

  // Library
  liked: Record<string, true>;
  recent: Song[];         // most-recent first, max 100

  // ─ Actions ──
  setCurrent: (s: Song | null) => void;
  setPlaying: (v: boolean) => void;
  setPosition: (s: number) => void;
  setDuration: (s: number) => void;
  setBuffering: (v: boolean) => void;
  setVolume: (v: number) => void;
  toggleFullScreen: () => void;

  playSong: (s: Song, opts?: { queue?: Song[]; replaceQueue?: boolean }) => void;
  enqueue: (s: Song | Song[]) => void;
  playNext: (s: Song) => void;
  next: () => Song | null;
  prev: () => Song | null;
  removeFromQueue: (i: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;

  setShuffle: (v: boolean) => void;
  cycleRepeat: () => void;

  toggleLike: (s: Song) => void;
  pushRecent: (s: Song) => void;
}

const REPEAT_CYCLE: Record<Repeat, Repeat> = { off: "all", all: "one", one: "off" };

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      current: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: 0.8,
      buffering: false,
      fullScreen: false,
      queue: [],
      history: [],
      shuffle: false,
      repeat: "off",
      liked: {},
      recent: [],

      setCurrent: (s) => set({ current: s }),
      setPlaying: (v) => set({ isPlaying: v }),
      setPosition: (s) => set({ position: s }),
      setDuration: (s) => set({ duration: s }),
      setBuffering: (v) => set({ buffering: v }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      toggleFullScreen: () => set((st) => ({ fullScreen: !st.fullScreen })),

      playSong: (s, opts) => {
        const cur = get().current;
        const history = cur ? [cur, ...get().history].slice(0, 50) : get().history;
        const queue = opts?.replaceQueue
          ? (opts.queue ?? [])
          : opts?.queue
          ? [...(opts.queue ?? []), ...get().queue]
          : get().queue;
        set({ current: s, isPlaying: true, position: 0, history, queue });
        get().pushRecent(s);
      },

      enqueue: (s) =>
        set((st) => ({ queue: [...st.queue, ...(Array.isArray(s) ? s : [s])] })),

      playNext: (s) => set((st) => ({ queue: [s, ...st.queue] })),

      next: () => {
        const { queue, current, repeat, history, shuffle } = get();
        if (repeat === "one" && current) {
          set({ position: 0, isPlaying: true });
          return current;
        }
        if (queue.length === 0) {
          if (repeat === "all" && history.length > 0) {
            const all = current ? [current, ...history] : history;
            const [first, ...rest] = all.reverse();
            set({ current: first ?? null, history: [], queue: rest, position: 0, isPlaying: !!first });
            return first ?? null;
          }
          set({ isPlaying: false });
          return null;
        }
        const idx = shuffle ? Math.floor(Math.random() * queue.length) : 0;
        const nextSong = queue[idx]!;
        const newQueue = [...queue.slice(0, idx), ...queue.slice(idx + 1)];
        const newHistory = current ? [current, ...history].slice(0, 50) : history;
        set({ current: nextSong, queue: newQueue, history: newHistory, position: 0, isPlaying: true });
        get().pushRecent(nextSong);
        return nextSong;
      },

      prev: () => {
        const { history, current, queue, position } = get();
        if (position > 3 && current) {
          set({ position: 0 });
          return current;
        }
        if (history.length === 0) {
          set({ position: 0 });
          return current;
        }
        const [last, ...rest] = history;
        const newQueue = current ? [current, ...queue] : queue;
        set({ current: last ?? null, history: rest, queue: newQueue, position: 0, isPlaying: !!last });
        return last ?? null;
      },

      removeFromQueue: (i) => set((st) => ({ queue: st.queue.filter((_, idx) => idx !== i) })),
      reorderQueue: (from, to) =>
        set((st) => {
          const q = [...st.queue];
          const [item] = q.splice(from, 1);
          if (item) q.splice(to, 0, item);
          return { queue: q };
        }),
      clearQueue: () => set({ queue: [] }),

      setShuffle: (v) => set({ shuffle: v }),
      cycleRepeat: () => set((st) => ({ repeat: REPEAT_CYCLE[st.repeat] })),

      toggleLike: (s) =>
        set((st) => {
          const next = { ...st.liked };
          if (next[s.id]) delete next[s.id];
          else next[s.id] = true;
          return { liked: next };
        }),

      pushRecent: (s) =>
        set((st) => {
          const filtered = st.recent.filter((r) => r.id !== s.id);
          return { recent: [s, ...filtered].slice(0, 100) };
        }),
    }),
    {
      name: "flexy-player",
      partialize: (s) => ({
        volume: s.volume,
        shuffle: s.shuffle,
        repeat: s.repeat,
        liked: s.liked,
        recent: s.recent,
        queue: s.queue,
        current: s.current,
        history: s.history,
      }),
    },
  ),
);
