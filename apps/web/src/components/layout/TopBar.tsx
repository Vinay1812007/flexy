import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";

export function TopBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState("");
  const d = useDebounce(q, 250);

  useEffect(() => {
    if (pathname === "/search" && d) {
      nav(`/search?q=${encodeURIComponent(d)}`, { replace: true });
    }
  }, [d, pathname, nav]);

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 py-3 md:-mx-8 md:px-8 backdrop-blur-xl bg-flexy-bg/70 border-b border-flexy-line">
      <div className="flex items-center gap-3">
        <div className="hidden gap-1 md:flex">
          <button
            onClick={() => history.back()}
            className="h-8 w-8 rounded-full bg-white/5 text-white/80 hover:bg-white/10"
            aria-label="Back"
          >
            <ChevronLeft size={16} className="mx-auto" />
          </button>
          <button
            onClick={() => history.forward()}
            className="h-8 w-8 rounded-full bg-white/5 text-white/80 hover:bg-white/10"
            aria-label="Forward"
          >
            <ChevronRight size={16} className="mx-auto" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q) nav(`/search?q=${encodeURIComponent(q)}`);
          }}
          className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-flexy-line focus-within:ring-flexy-accent/60"
        >
          <Search size={16} className="text-flexy-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Songs, artists, albums, playlists…"
            className="w-full bg-transparent text-sm placeholder:text-flexy-mute focus:outline-none"
          />
        </form>

        <Link
          to="/library"
          className="hidden md:inline-flex items-center rounded-full bg-flexy-accent px-3 py-1.5 text-xs font-semibold text-black hover:brightness-110"
        >
          Library
        </Link>
      </div>
    </div>
  );
}
