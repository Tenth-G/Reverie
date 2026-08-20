import type { Song } from "../api/types";
import { usePlayerStore } from "../store/playerStore";
import { formatTime } from "../utils/lyrics";
import { sizedImage } from "../utils/image";
import { IconPlay } from "./icons";

interface Props {
  songs: Song[];
  title?: string;
  countLabel?: string;
  emptyText?: string;
  showCover?: boolean;
}

export default function SongList({
  songs,
  title,
  countLabel,
  emptyText = "暂无歌曲",
  showCover = true,
}: Props) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playing = usePlayerStore((s) => s.playing);
  const playSong = usePlayerStore((s) => s.playSong);

  return (
    <>
      {title && (
        <div className="list-header">
          <h3>{title}</h3>
          <span className="count">{countLabel ?? `${songs.length} 首`}</span>
        </div>
      )}
      <div className="song-list">
        {songs.length === 0 ? (
          <div className="empty">{emptyText}</div>
        ) : (
          songs.map((song, i) => {
            const isCur = currentSong?.id === song.id;
            return (
              <div
                key={`${song.id}-${i}`}
                className={`song-item ${isCur ? "playing" : ""}`}
                onClick={() => playSong(song, songs)}
              >
                <span className="idx">
                  {isCur ? <IconPlay width={13} height={13} /> : i + 1}
                </span>
                {showCover &&
                  (song.picUrl ? (
                    <img
                      src={sizedImage(song.picUrl, 80)}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9,
                        background: "var(--bg-3)",
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-faint)",
                      }}
                    >
                      ♪
                    </span>
                  ))}
                <div className="meta">
                  <div
                    className={`t ${isCur && playing ? "playing-text" : ""}`}
                  >
                    {song.name}
                    {song.fee === 1 && <span className="vip-badge">VIP</span>}
                  </div>
                  <div className="a">
                    {song.artists}
                    {song.album ? ` · ${song.album}` : ""}
                  </div>
                </div>
                <span className="dur">{formatTime(song.duration)}</span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
