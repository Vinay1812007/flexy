import { useRef } from "react";
import { cn } from "@flexy/ui";

interface Props {
  current: number;
  duration: number;
  onSeek: (s: number) => void;
  className?: string;
}

export function SeekBar({ current, duration, onSeek, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div
      ref={ref}
      onClick={handle}
      role="slider"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("group relative h-1.5 cursor-pointer rounded-full bg-white/10", className)}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-flexy-accent to-flexy-accent2 transition-all"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-white opacity-0 transition group-hover:opacity-100"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
