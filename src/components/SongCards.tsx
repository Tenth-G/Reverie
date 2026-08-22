import { useState } from "react";
import type { Song } from "../api/types";
import { usePlayerStore } from "../store/playerStore";
import { useMediaStore } from "../store/mediaStore";
import { sizedImage } from "../utils/image";
import { Clapperboard, Disc3, ThumbsDown } from "lucide-react";
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
  const openMedia = useMediaStore((s) => s.open);
  const [dismissing, setDismissing] = useState<number[]>([]);

  if (!songs.length && loading) return <LoadingState label="正在加载推荐…" />;
  if (!songs.length) return <div className="empty">暂无推荐</div>;
  return (
    <div className="song-cards">
      {songs.map((song) => {
        const isDismissing = dismissing.includes(song.id);
        return (
          <article
            key={song.id}
            className={`song-card ${isDismissing ? "dismissing" : ""}`}
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
              <div className="card-cover-actions">
                {song.mvId ? (
                  <button
                    className="card-action-btn"
                    title="观看 MV"
                    onClick={(event) => {
                      event.stopPropagation();
                      void openMedia({
                        id: String(song.mvId),
                        name: song.name,
                        coverUrl: song.picUrl,
                        creatorName: song.artists,
                        duration: 0,
                        playCount: 0,
                        kind: "mv",
                      });
                    }}
                  >
                    <Clapperboard size={15} />
                    <span>MV</span>
                  </button>
                ) : null}
                {onDislike ? (
                  <button
                    className="card-action-btn dislike"
                    title="不感兴趣"
                    onClick={(event) => {
                      event.stopPropagation();
                      // 先播放淡出动画，再从推荐数据中移除
                      setDismissing((current) => [...current, song.id]);
                      setTimeout(() => onDislike(song), 220);
                    }}
                  >
                    <ThumbsDown size={15} />
                    <span>不感兴趣</span>
                  </button>
                ) : null}
              </div>
            </div>
            <div className="n">{song.name}</div>
            <div className="a">{song.artists}</div>
          </article>
        );
      })}
    </div>
  );
}
