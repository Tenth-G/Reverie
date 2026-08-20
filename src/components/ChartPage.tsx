import { usePlayerStore } from "../store/playerStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";

export default function ChartPage() {
  const topSongs = usePlayerStore((s) => s.topSongs);
  const topSongsLoading = usePlayerStore((s) => s.topSongsLoading);

  return (
    <Page>
      <PageHeader title="排行榜" subtitle="飙升榜 · 热门歌曲" />
      <SongList
        songs={topSongs}
        emptyText={topSongsLoading ? "加载中…" : "暂无排行数据"}
      />
    </Page>
  );
}
