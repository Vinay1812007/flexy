import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MiniPlayer } from "../player/MiniPlayer";
import { FullPlayer } from "../player/FullPlayer";
import { useAudio } from "../../hooks/useAudio";
import { usePlayerStore } from "../../store/player";
import { AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  useAudio(); // mount engine
  const fullScreen = usePlayerStore((s) => s.fullScreen);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex-1 overflow-y-auto pb-32">
          <TopBar />
          <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8 md:pt-6">{children}</div>
        </main>
      </div>
      <MiniPlayer />
      <AnimatePresence>{fullScreen ? <FullPlayer key="full" /> : null}</AnimatePresence>
    </div>
  );
}
