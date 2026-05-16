import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Skeleton } from "@flexy/ui";

export function LyricsPanel({ songId }: { songId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["lyrics", songId],
    queryFn: () => api.lyrics(songId),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (data?.synced?.length) {
    // TODO karaoke highlight — wire to position
    return (
      <div className="h-full overflow-y-auto scrollbar-none pr-2">
        {data.synced.map((l, i) => (
          <p key={i} className="py-1 text-sm leading-relaxed text-white/80 hover:text-white">
            {l.text}
          </p>
        ))}
      </div>
    );
  }

  if (data?.plain) {
    return (
      <pre className="h-full overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80 scrollbar-none">
        {data.plain}
      </pre>
    );
  }

  return <p className="text-sm text-flexy-mute">Lyrics aren't available for this song.</p>;
}
