import type { Album } from "@flexy/types";
import { Image } from "@flexy/ui";
import { Link } from "react-router-dom";
import { pickCover } from "../../lib/format";

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link
      to={`/album/${encodeURIComponent(album.id)}`}
      className="group w-44 flex-shrink-0 snap-start text-left"
    >
      <Image src={pickCover(album.image)} alt={album.name} className="aspect-square w-full rounded-xl" />
      <p className="mt-2 truncate text-sm font-medium">{album.name}</p>
      <p className="truncate text-xs text-flexy-mute">
        {album.artists.map((a) => a.name).join(", ")}
      </p>
    </Link>
  );
}
