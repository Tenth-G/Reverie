import { Disc3, MessageCircle, Play, UserRound } from "lucide-react";
import type { Song } from "../api/types";
import { useCommentStore } from "../store/commentStore";
import { useExploreStore } from "../store/exploreStore";
import { usePlayerStore } from "../store/playerStore";
import { formatTime } from "../utils/lyrics";
import { sizedImage } from "../utils/image";
import { LoadingState } from "./Page";

interface Props {
  songs: Song[];
  title?: string;
  countLabel?: string;
  emptyText?: string;
  showCover?: boolean;
  loading?: boolean;
}

export default function SongList({
  songs,
  title,
  countLabel,
  emptyText = "暂无歌曲",
  showCover = true,
  loading = false,
}: Props) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playSong = usePlayerStore((s) => s.playSong);
  const openAlbum = useExploreStore((s) => s.openAlbum);
  const openArtist = useExploreStore((s) => s.openArtist);
  const openComments = useCommentStore((s) => s.openResourceComments);

  return (
    <>
      {title && (
        <div className="list-header">
          <h3>{title}</h3>
          <span className="count">{countLabel ?? `${songs.length} 首`}</span>
        </div>
      )}
      <div className="song-list">
        {songs.length === 0 && loading ? (
          <LoadingState />
        ) : songs.length === 0 ? (
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
                  {isCur ? <Play size={13} fill="currentColor" /> : i + 1}
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
                      <Disc3 size={17} />
                    </span>
                  ))}
                <div className="meta">
                  <div className={`t ${isCur ? "playing-text" : ""}`}>
                    {song.name}
                    {song.fee === 1 && <span className="vip-badge">VIP</span>}
                  </div>
                  <div className="a">
                    {song.artists}
                    {song.album ? ` · ${song.album}` : ""}
                  </div>
                </div>
                <div
                  className="song-row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="icon-action"
                    title={song.programId ? "节目评论" : "歌曲评论"}
                    onClick={() =>
                      void openComments(
                        {
                          type: song.programId ? "program" : "song",
                          id: String(song.programId ?? song.id),
                          title: song.name,
                          subtitle: song.programId ? song.album : song.artists,
                          coverUrl: song.picUrl,
                        },
                        true,
                      )
                    }
                  >
                    <MessageCircle size={15} />
                  </button>
                  {song.artistIds?.[0] ? (
                    <button
                      className="icon-action"
                      title="歌手详情"
                      onClick={() => void openArtist(song.artistIds![0])}
                    >
                      <UserRound size={15} />
                    </button>
                  ) : null}
                  {song.albumId > 0 ? (
                    <button
                      className="icon-action"
                      title="专辑详情"
                      onClick={() => void openAlbum(song.albumId)}
                    >
                      <Disc3 size={15} />
                    </button>
                  ) : null}
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
