import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../lib/admin-api";

export function Dashboard() {
  const plays = useQuery({ queryKey: ["plays"], queryFn: () => adminApi.plays(7) });
  const searches = useQuery({ queryKey: ["searches"], queryFn: () => adminApi.searches(7) });
  const health = useQuery({ queryKey: ["health"], queryFn: adminApi.health });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Overview</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="API health (avg EMA)" value={
          health.data
            ? `${Math.round((health.data.reduce((s, x) => s + x.ema, 0) / health.data.length) * 100)}%`
            : "—"
        }/>
        <Stat label="Plays (7d)" value={plays.data?.reduce((s, x) => s + x.plays, 0) ?? "—"} />
        <Stat label="Searches (7d)" value={searches.data?.reduce((s, x) => s + x.hits, 0) ?? "—"} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Top songs (7 days)">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr><th className="text-left">Song</th><th className="text-right">Plays</th></tr>
            </thead>
            <tbody>
              {plays.data?.slice(0, 15).map((r) => (
                <tr key={r.song_id} className="border-t border-white/5">
                  <td className="py-1.5">{r.song_name}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.plays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Top searches (7 days)">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr><th className="text-left">Query</th><th className="text-right">Hits</th></tr>
            </thead>
            <tbody>
              {searches.data?.slice(0, 15).map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-1.5">{r.query}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
      <h3 className="mb-3 font-medium">{title}</h3>
      {children}
    </div>
  );
}
