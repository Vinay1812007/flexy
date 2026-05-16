import { NavLink } from "react-router-dom";
import { Home, Search, Heart, Sparkles, Library } from "lucide-react";
import { cn } from "@flexy/ui";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/discover", label: "Discover", icon: Sparkles },
  { to: "/library", label: "Your library", icon: Library },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r border-flexy-line p-4 md:flex">
      <div className="px-2 pb-4">
        <span className="text-2xl font-display font-bold tracking-tight">
          flexy<span className="text-grad">.</span>
        </span>
      </div>

      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-flexy-mute hover:bg-white/5 hover:text-white",
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-xl border border-flexy-line p-4 text-xs text-flexy-mute">
        <p className="mb-2 flex items-center gap-1 text-white">
          <Heart size={14} className="text-flexy-accent" /> Made for you
        </p>
        <p>Mood mixes, AI playlists & language-based discovery. Tap Search to start.</p>
      </div>
    </aside>
  );
}
