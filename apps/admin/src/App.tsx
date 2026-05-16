import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useState } from "react";
import { getToken, setToken } from "./lib/admin-api";
import { Dashboard } from "./pages/Dashboard";
import { Health } from "./pages/Health";
import { Content } from "./pages/Content";
import { Cache } from "./pages/Cache";
import { Errors } from "./pages/Errors";

const links = [
  { to: "/", label: "Overview" },
  { to: "/health", label: "API Health" },
  { to: "/content", label: "Content" },
  { to: "/cache", label: "Cache" },
  { to: "/errors", label: "Errors" },
];

export function App() {
  const [authed, setAuthed] = useState(!!getToken());
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  return (
    <div className="flex min-h-full">
      <aside className="w-60 shrink-0 border-r border-white/10 p-4">
        <h1 className="mb-6 text-lg font-semibold">Flexy · Admin</h1>
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                "block rounded-md px-3 py-2 text-sm " +
                (isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => { setToken(""); location.reload(); }}
          className="mt-6 text-xs text-slate-400 hover:text-white"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/health" element={<Health />} />
          <Route path="/content" element={<Content />} />
          <Route path="/cache" element={<Cache />} />
          <Route path="/errors" element={<Errors />} />
        </Routes>
      </main>
    </div>
  );
}

function Login({ onAuthed }: { onAuthed: () => void }) {
  const [v, setV] = useState("");
  return (
    <div className="grid min-h-full place-items-center p-6">
      <form
        onSubmit={(e) => { e.preventDefault(); setToken(v); onAuthed(); }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <h2 className="mb-1 text-lg font-semibold">Admin sign in</h2>
        <p className="mb-4 text-sm text-slate-400">Enter your ADMIN_TOKEN to continue.</p>
        <input
          type="password"
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="Admin token"
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-white/5 focus:ring-emerald-400"
        />
        <button className="mt-4 w-full rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-black hover:brightness-110">
          Continue
        </button>
      </form>
    </div>
  );
}
