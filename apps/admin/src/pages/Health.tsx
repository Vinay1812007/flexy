import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../lib/admin-api";

export function Health() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: adminApi.health,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">API Health</h2>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          {isFetching ? "Probing…" : "Probe now"}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-slate-400">
            <tr>
              <th className="px-4 py-2">Adapter</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Latency</th>
              <th className="px-4 py-2">EMA</th>
              <th className="px-4 py-2">Priority</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Probing…</td></tr>
            ) : null}
            {data?.map((row) => (
              <tr key={row.adapter} className="border-t border-white/5">
                <td className="px-4 py-2 font-mono text-xs">{row.adapter}</td>
                <td className="px-4 py-2">
                  <span className={row.ok ? "text-emerald-400" : "text-rose-400"}>
                    {row.ok ? "● up" : "● down"}
                  </span>
                </td>
                <td className="px-4 py-2 tabular-nums">{row.ms} ms</td>
                <td className="px-4 py-2 tabular-nums">{Math.round(row.ema * 100)}%</td>
                <td className="px-4 py-2 tabular-nums">{row.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
