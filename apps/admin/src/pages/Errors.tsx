import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../lib/admin-api";

export function Errors() {
  const { data, isLoading } = useQuery({ queryKey: ["errors"], queryFn: adminApi.errors });
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Recent errors</h2>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-slate-400">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Route</th>
              <th className="px-4 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr> : null}
            {data?.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="px-4 py-2 whitespace-nowrap text-slate-400">{new Date(r.ts).toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.route}</td>
                <td className="px-4 py-2">{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
