import { useEffect } from "react";
import { usePlayerStore } from "../store/player";

/** Spotify-style shortcuts. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      const st = usePlayerStore.getState();
      switch (e.key) {
        case " ":
          e.preventDefault();
          st.setPlaying(!st.isPlaying);
          break;
        case "ArrowRight":
          if (e.shiftKey) { e.preventDefault(); st.next(); }
          break;
        case "ArrowLeft":
          if (e.shiftKey) { e.preventDefault(); st.prev(); }
          break;
        case "ArrowUp":
          if (e.shiftKey) { e.preventDefault(); st.setVolume(st.volume + 0.05); }
          break;
        case "ArrowDown":
          if (e.shiftKey) { e.preventDefault(); st.setVolume(st.volume - 0.05); }
          break;
        case "m":
        case "M":
          st.setVolume(st.volume > 0 ? 0 : 0.8);
          break;
        case "s":
        case "S":
          st.setShuffle(!st.shuffle);
          break;
        case "r":
        case "R":
          st.cycleRepeat();
          break;
        case "f":
        case "F":
          st.toggleFullScreen();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
