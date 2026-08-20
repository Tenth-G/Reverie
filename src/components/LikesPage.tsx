import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";

export default function LikesPage() {
  const likedSongs = usePlayerStore((s) => s.likedSongs);
  const loadLikedSongs = usePlayerStore((s) => s.loadLikedSongs);

  // auto refresh the full liked list when the page opens
  useEffect(() => {
    loadLikedSongs();
  }, [loadLikedSongs]);

  return (
    <Page>
      <PageHeader
        title="我的喜欢"
        subtitle={`${likedSongs.length} 首红心歌曲`}
      />
      <SongList
        songs={likedSongs}
        emptyText="还没有喜欢的歌曲，点播放栏的红心收藏吧"
      />
    </Page>
  );
}
