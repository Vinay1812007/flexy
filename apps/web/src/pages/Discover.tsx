import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button, Image } from "@flexy/ui";
import { usePlayerStore } from "../store/player";
import { Sparkles, Wand2 } from "lucide-react";
import { pickCover } from "../lib/format";

const MOODS = ["happy", "sad", "romantic", "workout", "chill", "party", "focus"] as const;
const LANGS = ["hindi", "english", "telugu", "tamil", "punjabi"] as const;

export function Discover() {
  const [mood, setMood] = useState<typeof MOODS[number]>("chill");
  const [lang, setLang] = useState<typeof LANGS[number]>("hindi");
  const [seed, setSeed] = useState("");
  const [prompt, setPrompt] = useState("");

  const playlistMut = useMutation({
    mutationFn: () => api.aiPlaylist({ mood, language: lang as any, seed, size: 20 }),
  });

  const nlMut = useMutation({
    mutationFn: async (text: string) => {
      const parsed = await api.aiNL(text);
      const result = await api.search(parsed.query, "song", 20);
      return result.songs.results;
    },
    onSuccess: (songs) => {
      if (songs[0]) usePlayerStore.getState().playSong(songs[0], { queue: songs.slice(1), replaceQueue: true });
    },
  });

  return (
    <div className="space-y-10 pt-4">
      <section className="rounded-3xl glass p-6 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-flexy-accent">Discover</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Tell us a vibe.</h1>
        <p className="mt-1 text-flexy-mute">
          We'll build a playlist in seconds. Try mixing a mood, a language and a seed artist.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Selector label="Mood" value={mood} options={MOODS as readonly string[]} onChange={(v) => setMood(v as any)} />
          <Selector label="Language" value={lang} options={LANGS as readonly string[]} onChange={(v) => setLang(v as any)} />
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-flexy-mute">Seed (optional)</p>
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="e.g. Anirudh, AR Rahman"
              className="w-full rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-flexy-line focus:outline-none focus:ring-flexy-accent"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => playlistMut.mutate()} loading={playlistMut.isPending}>
            <Sparkles size={14} /> Generate playlist
          </Button>
        </div>

        {playlistMut.data ? (
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/5 p-4">
            <Image src={pickCover(playlistMut.data.image)} alt={playlistMut.data.name} className="h-20 w-20 rounded-lg" />
            <div className="flex-1">
              <p className="font-semibold">{playlistMut.data.name}</p>
              <p className="text-sm text-flexy-mute">{playlistMut.data.description}</p>
            </div>
            <Button
              onClick={() => {
                const songs = playlistMut.data.songs ?? [];
                if (songs[0]) usePlayerStore.getState().playSong(songs[0], { queue: songs.slice(1), replaceQueue: true });
              }}
            >
              Play
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl glass p-6 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-flexy-accent">Ask Flexy</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Natural language search</h2>
        <p className="mt-1 text-flexy-mute">"Play sad Telugu songs", "Workout music in Hindi"…</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (prompt) nlMut.mutate(prompt); }}
          className="mt-4 flex gap-2"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Tell me what you want to hear…"
            className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm ring-1 ring-flexy-line focus:outline-none focus:ring-flexy-accent"
          />
          <Button loading={nlMut.isPending}><Wand2 size={14} /> Play it</Button>
        </form>
      </section>
    </div>
  );
}

function Selector({
  label, value, options, onChange,
}: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-widest text-flexy-mute">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={
              "rounded-full px-3 py-1 text-xs capitalize transition " +
              (value === o
                ? "bg-flexy-accent text-black"
                : "bg-white/5 text-flexy-mute hover:bg-white/10 hover:text-white")
            }
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
