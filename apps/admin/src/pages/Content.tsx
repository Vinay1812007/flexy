import { useState } from "react";
import { adminApi } from "../lib/admin-api";

const PRESETS = [
  { key: "hero", label: "Homepage hero", example: `{"image":[{"url":"..."}],"title":"...","cta":{"label":"Play","href":"/"}}` },
  { key: "featured-playlists", label: "Featured playlists (rail)", example: `[{"id":"p123","name":"Editorial","image":[{"url":"..."}],"songCount":40,"type":"playlist","source":"saavn-dev"}]` },
];

export function Content() {
  const [key, setKey] = useState(PRESETS[0]!.key);
  const [json, setJson] = useState(PRESETS[0]!.example);
  const [ttl, setTtl] = useState(7 * 24 * 60 * 60);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    try {
      const value = JSON.parse(json);
      await adminApi.setCms(key, value, ttl);
      setMsg(`Saved cms:${key} for ${ttl}s`);
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`);
    }
  };

  const remove = async () => {
    await adminApi.deleteCms(key);
    setMsg(`Removed cms:${key}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Content overrides</h2>
      <p className="text-sm text-slate-400">
        Writes are stored in <code>KV CATALOG</code> under <code>cms:&lt;key&gt;</code>
        and consumed by the homepage rails / hero.
      </p>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => { setKey(p.key); setJson(p.example); }}
              className={"rounded-full px-3 py-1 text-xs " + (key === p.key ? "bg-emerald-400 text-black" : "bg-white/5 hover:bg-white/10")}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="block text-xs text-slate-400">CMS key</label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-white/5 focus:ring-emerald-400"
        />

        <label className="block text-xs text-slate-400">JSON value</label>
        <textarea
          rows={10}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="w-full rounded bg-slate-800 px-3 py-2 font-mono text-xs outline-none ring-1 ring-white/5 focus:ring-emerald-400"
        />

        <label className="block text-xs text-slate-400">TTL (seconds)</label>
        <input
          type="number"
          value={ttl}
          onChange={(e) => setTtl(Number(e.target.value))}
          className="w-40 rounded bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-white/5 focus:ring-emerald-400"
        />

        <div className="flex gap-2">
          <button onClick={submit} className="rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black hover:brightness-110">
            Save
          </button>
          <button onClick={remove} className="rounded-md bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110">
            Remove
          </button>
          {msg ? <span className="self-center text-xs text-slate-400">{msg}</span> : null}
        </div>
      </div>
    </div>
  );
}
