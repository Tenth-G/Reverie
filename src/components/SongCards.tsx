import type { Song } from "../api/types";
import { usePlayerStore } from "../store/playerStore";
import { sizedImage } from "../utils/image";
import { Disc3 } from "lucide-react";
import { X } from "lucide-react";
import { LoadingState } from "./Page";

export default function SongCards({
  songs,
  loading = false,
  onDislike,
}: {
  songs: Song[];
  loading?: boolean;
  onDislike?: (song: Song) => void;
}) {
  const playSong = usePlayerStore((s) => s.playSong);
  if (!songs.length && loading) return <LoadingState label="正在加载推荐…" />;
  if (!songs.length) return <div className="empty">暂无推荐</div>;
  return (
    <div className="song-cards">
      {songs.map((song) => (
        <article
          key={song.id}
          className="song-card"
          onClick={() => playSong(song, songs)}
        >
          <div className="card-cover">
            {song.picUrl ? (
              <img
                src={sizedImage(song.picUrl, 320)}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="song-card-ph">
                <Disc3 size={24} />
              </span>
            )}
          </div>
          <div className="n">{song.name}</div>
          <div className="a">{song.artists}</div>
          {onDislike && (
            <button
              className="song-card-dislike"
              title="不感兴趣"
              onClick={(event) => {
                event.stopPropagation();
                onDislike(song);
              }}
            >
              <X size={14} />
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
