import { usePlayerStore } from "../../store/player";
import { Image, Button } from "@flexy/ui";
import { pickCover } from "../../lib/format";
import { Sparkles, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useState } from "react";

export function QueuePanel() {
  const queue = usePlayerStore((s) => s.queue);
  const remove = usePlayerStore((s) => s.removeFromQueue);
  const clear = usePlayerStore((s) => s.clearQueue);
  const [smarting, setSmarting] = useState(false);

  const smart = async () => {
    if (queue.length < 2) return;
    setSmarting(true);
    try {
      const ordered = await api.aiSmartQueue(queue.map((s) => s.id));
      const byId = new Map(queue.map((s) => [s.id, s]));
      const reordered = ordered.map((id) => byId.get(id)).filter(Boolean) as typeof queue;
      usePlayerStore.setState({ queue: reordered });
    } catch { /* silent */ }
    finally { setSmarting(false); }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between pb-3">
        <h3 className="text-sm uppercase tracking-wider text-flexy-mute">
          Up next · {queue.length}
        </h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={smart} loading={smarting}>
            <Sparkles size={14} /> Smart reorder
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 size={14} />
          </Button>
        </div>
      </header>

      {queue.length === 0 ? (
        <p className="text-sm text-flexy-mute">Queue is empty. Add a song with the ⋯ menu.</p>
      ) : (
        <ul className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-none">
          {queue.map((s, i) => (
            <li
              key={`${s.id}-${i}`}
              className="group flex items-center gap-3 rounded-lg p-2 hover:bg-white/5"
            >
              <Image src={pickCover(s.image)} alt={s.name} className="h-10 w-10 rounded" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{s.name}</p>
                <p className="truncate text-xs text-flexy-mute">
                  {s.artists.primary.map((a) => a.name).join(", ")}
                </p>
              </div>
              <button
                onClick={() => remove(i)}
                aria-label="Remove"
                className="opacity-0 group-hover:opacity-100 transition text-flexy-mute hover:text-white"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
