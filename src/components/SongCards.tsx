import type { Song } from "../api/types";
import { usePlayerStore } from "../store/playerStore";

export default function SongCards({ songs }: { songs: Song[] }) {
  const playSong = usePlayerStore((s) => s.playSong);
  if (!songs.length) return <div className="empty">加载中…</div>;
  return (
    <div className="song-cards">
      {songs.map((song) => (
        <div
          key={song.id}
          className="song-card"
          onClick={() => playSong(song, songs)}
        >
          {song.picUrl ? (
            <img src={song.picUrl} alt="" loading="lazy" />
          ) : (
            <span className="song-card-ph">♪</span>
          )}
          <div className="n">{song.name}</div>
          <div className="a">{song.artists}</div>
        </div>
      ))}
    </div>
  );
}
