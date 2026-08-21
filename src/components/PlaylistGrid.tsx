import type { ReactNode } from "react";
import type { PlaylistInfo } from "../api/types";
import { sizedImage } from "../utils/image";
import { LoadingState } from "./Page";

interface Props {
  playlists: PlaylistInfo[];
  onOpen: (id: number, name: string) => void;
  emptyText?: string;
  renderActions?: (playlist: PlaylistInfo) => ReactNode;
  loading?: boolean;
}

export default function PlaylistGrid({
  playlists,
  onOpen,
  emptyText = "暂无歌单",
  renderActions,
  loading = false,
}: Props) {
  if (!playlists.length) {
    if (loading) return <LoadingState label="正在加载歌单…" />;
    return <div className="empty">{emptyText}</div>;
  }
  return (
    <div className="playlist-grid">
      {playlists.map((p) => (
        <div
          key={p.id}
          className="playlist-card"
          onPointerEnter={() => void import("./PlaylistPage")}
          onClick={() => onOpen(p.id, p.name)}
        >
          <div className="card-cover">
            <img
              src={sizedImage(p.coverImgUrl, 320)}
              alt=""
              loading="lazy"
              decoding="async"
            />
            {renderActions && (
              <div
                className="playlist-card-actions"
                onClick={(e) => e.stopPropagation()}
              >
                {renderActions(p)}
              </div>
            )}
          </div>
          <div className="n">{p.name}</div>
          <div className="c">{p.trackCount} 首</div>
        </div>
      ))}
    </div>
  );
}
