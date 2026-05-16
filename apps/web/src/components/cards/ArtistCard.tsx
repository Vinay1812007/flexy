import type { Artist } from "@flexy/types";
import { Image } from "@flexy/ui";
import { Link } from "react-router-dom";
import { pickCover } from "../../lib/format";

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      to={`/artist/${encodeURIComponent(artist.id)}`}
      className="group w-44 flex-shrink-0 snap-start text-center"
    >
      <Image src={pickCover(artist.image)} alt={artist.name} className="mx-auto h-40 w-40 rounded-full" />
      <p className="mt-3 truncate text-sm font-medium">{artist.name}</p>
      <p className="text-xs text-flexy-mute">Artist</p>
    </Link>
  );
}
