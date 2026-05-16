import type { Playlist } from "@flexy/types";
import { Image } from "@flexy/ui";
import { Link } from "react-router-dom";
import { pickCover } from "../../lib/format";

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      to={`/playlist/${encodeURIComponent(playlist.id)}`}
      className="group w-44 flex-shrink-0 snap-start text-left"
    >
      <Image
        src={pickCover(playlist.image)}
        alt={playlist.name}
        className="aspect-square w-full rounded-xl"
      />
      <p className="mt-2 truncate text-sm font-medium">{playlist.name}</p>
      <p className="truncate text-xs text-flexy-mute">{playlist.songCount ?? 0} songs</p>
    </Link>
  );
}
