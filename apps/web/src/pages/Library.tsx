import { usePlayerStore } from "../store/player";
import { SongList } from "../components/lists/SongList";

export function Library() {
  const liked  = usePlayerStore((s) => s.liked);
  const recent = usePlayerStore((s) => s.recent);

  const likedSongs = recent.filter((s) => liked[s.id]);

  return (
    <div className="space-y-10 pt-4">
      <section>
        <h2 className="mb-3 text-2xl font-bold">Liked songs</h2>
        {likedSongs.length ? (
          <SongList songs={likedSongs} />
        ) : (
          <p className="text-flexy-mute">Tap the heart on any song to add it here.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Recently played</h2>
        {recent.length ? <SongList songs={recent} /> : <p className="text-flexy-mute">Nothing yet — go press play.</p>}
      </section>
    </div>
  );
}
