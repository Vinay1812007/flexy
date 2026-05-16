import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Skeleton } from "@flexy/ui";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const Home     = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const Search   = lazy(() => import("./pages/Search").then((m) => ({ default: m.Search })));
const Album    = lazy(() => import("./pages/Album").then((m) => ({ default: m.Album })));
const Artist   = lazy(() => import("./pages/Artist").then((m) => ({ default: m.Artist })));
const Playlist = lazy(() => import("./pages/Playlist").then((m) => ({ default: m.Playlist })));
const Library  = lazy(() => import("./pages/Library").then((m) => ({ default: m.Library })));
const Discover = lazy(() => import("./pages/Discover").then((m) => ({ default: m.Discover })));

const Fallback = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-40 w-full rounded-2xl" />
  </div>
);

export function App() {
  useKeyboardShortcuts();
  return (
    <Layout>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/album/:id" element={<Album />} />
          <Route path="/artist/:id" element={<Artist />} />
          <Route path="/playlist/:id" element={<Playlist />} />
          <Route path="/library" element={<Library />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
