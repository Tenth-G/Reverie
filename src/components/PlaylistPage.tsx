import { usePlayerStore } from "../store/playerStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";

export default function PlaylistPage() {
  const playlistSongs = usePlayerStore((s) => s.playlistSongs);
  const playlistName = usePlayerStore((s) => s.playlistName);
  const closePlaylist = usePlayerStore((s) => s.closePlaylist);

  return (
    <Page>
      <PageHeader
        title={playlistName || "歌单"}
        subtitle={`${playlistSongs.length} 首`}
        actions={
          <button className="btn" onClick={closePlaylist}>
            ← 返回
          </button>
        }
      />
      <SongList songs={playlistSongs} emptyText="歌单为空" />
    </Page>
  );
}
