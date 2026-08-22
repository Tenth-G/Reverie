import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";
import { useChartStore } from "../store/chartStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";

export default function ChartPage() {
  const topSongs = usePlayerStore((s) => s.topSongs);
  const topSongsLoading = usePlayerStore((s) => s.topSongsLoading);
  const charts = useChartStore((s) => s.charts);
  const selectedId = useChartStore((s) => s.selectedId);
  const chartSongs = useChartStore((s) => s.songs);
  const loading = useChartStore((s) => s.loading);
  const songsLoading = useChartStore((s) => s.songsLoading);
  const load = useChartStore((s) => s.load);
  const select = useChartStore((s) => s.select);
  useEffect(() => {
    void load();
  }, [load]);
  const selected = charts.find((chart) => chart.id === selectedId);
  const songs = selectedId ? chartSongs : topSongs;

  return (
    <Page>
      <PageHeader
        title="排行榜"
        subtitle={selected?.updateFrequency || selected?.name || "飙升榜 · 热门歌曲"}
        actions={
          <button
            className="icon-button"
            title="刷新榜单"
            onClick={() => void load()}
            disabled={loading || songsLoading}
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        }
      />
      {charts.length > 0 && (
        <div className="collection-tabs chart-tabs" role="tablist" aria-label="音乐榜单">
          {charts.map((chart) => (
            <button
              key={chart.id}
              role="tab"
              aria-selected={chart.id === selectedId}
              className={chart.id === selectedId ? "active" : ""}
              onClick={() => void select(chart.id)}
              disabled={songsLoading}
              title={chart.description || chart.name}
            >
              {chart.name}
            </button>
          ))}
        </div>
      )}
      <SongList
        songs={songs}
        loading={songsLoading || (!charts.length && topSongsLoading)}
        emptyText="暂无排行数据"
      />
    </Page>
  );
}
