import { useRef, type ReactNode } from "react";
import { cn } from "./cn";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Horizontally scrollable rail with optional snap + nav buttons. */
export function ScrollRail({ title, subtitle, children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth - 80), behavior: "smooth" });
  };

  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex items-end justify-between px-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-white/50">{subtitle}</p> : null}
        </div>
        <div className="hidden gap-1 md:flex">
          <button
            aria-label="Scroll left"
            onClick={() => nudge(-1)}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/15 transition"
          >
            ‹
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => nudge(1)}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/15 transition"
          >
            ›
          </button>
        </div>
      </header>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none"
      >
        {children}
      </div>
    </section>
  );
}
