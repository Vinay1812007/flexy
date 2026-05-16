import { useState } from "react";
import { adminApi } from "../lib/admin-api";

const PRESETS = ["search:", "song:", "album:", "artist:", "playlist:", "home:", "trending:", "suggest:", "lyrics:", "cms:"];

export function Cache() {
  const [prefix, setPrefix] = useState("search:");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const purge = async () => {
    setBusy(true);
    try {
      const r = await adminApi.purge(prefix);
      setMsg(`Purged ${r.purged} keys under "${prefix}"`);
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Cache</h2>
      <p className="text-sm text-slate-400">Purge KV entries by prefix. Use sparingly — adapters are then hit again on cold reads.</p>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-3">
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setPrefix(p)}
              className={"rounded-full px-3 py-1 text-xs font-mono " + (prefix === p ? "bg-emerald-400 text-black" : "bg-white/5 hover:bg-white/10")}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 font-mono text-xs outline-none ring-1 ring-white/5 focus:ring-emerald-400"
        />
        <button
          onClick={purge}
          disabled={busy}
          className="rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Purging…" : "Purge prefix"}
        </button>
        {msg ? <p className="text-xs text-slate-400">{msg}</p> : null}
      </div>
    </div>
  );
}
