import { useEffect, useMemo, useState } from "react";
import { MapPin, Palette, RefreshCw } from "lucide-react";
import {
  getChartCities,
  getDimensionChartDetail,
  getDimensionChartSongs,
  type DimensionChartQuery,
} from "../api/charts";
import { getStyleTags } from "../api/style";
import type { ChartCity, DimensionChartDetail, Song, StyleTag } from "../api/types";
import { usePlayerStore } from "../store/playerStore";
import { useChartStore } from "../store/chartStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";

type ChartMode = "global" | "city" | "style";

function flattenCities(cities: ChartCity[]): ChartCity[] {
  return cities.flatMap((city) => (city.children.length ? flattenCities(city.children) : [city]));
}

export default function ChartPage() {
  const [mode, setMode] = useState<ChartMode>("global");
  const [cities, setCities] = useState<ChartCity[]>([]);
  const [styles, setStyles] = useState<StyleTag[]>([]);
  const [cityId, setCityId] = useState("");
  const [styleId, setStyleId] = useState("");
  const [dimensionDetail, setDimensionDetail] = useState<DimensionChartDetail | null>(null);
  const [dimensionSongs, setDimensionSongs] = useState<Song[]>([]);
  const [dimensionLoading, setDimensionLoading] = useState(false);
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

  useEffect(() => {
    let alive = true;
    void Promise.all([getChartCities("chart"), getStyleTags()])
      .then(([nextCities, nextStyles]) => {
        if (!alive) return;
        setCities(nextCities);
        setStyles(nextStyles);
        const cityOptions = flattenCities(nextCities);
        setCityId((current) => current || cityOptions[0]?.id || "");
        setStyleId((current) => current || String(nextStyles[0]?.id ?? ""));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const cityOptions = useMemo(() => flattenCities(cities), [cities]);
  const dimensionQuery = useMemo<DimensionChartQuery | null>(() => {
    if (mode === "city" && cityId) {
      return { chartCode: "CITY_SONG_CHART", targetId: cityId, targetType: "CITY" };
    }
    if (mode === "style" && cityId && styleId) {
      return {
        chartCode: "CITY_STYLE_SONG_CHART",
        targetId: `${cityId}_${styleId}`,
        targetType: "CITY_STYLE",
      };
    }
    return null;
  }, [cityId, mode, styleId]);

  const loadDimension = async () => {
    if (!dimensionQuery) return;
    setDimensionLoading(true);
    try {
      const [detail, songs] = await Promise.all([
        getDimensionChartDetail(dimensionQuery),
        getDimensionChartSongs(dimensionQuery),
      ]);
      setDimensionDetail(detail);
      setDimensionSongs(songs);
    } catch {
      setDimensionDetail(null);
      setDimensionSongs([]);
      usePlayerStore.getState().toast("加载城市榜失败", "error");
    } finally {
      setDimensionLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "global" || !dimensionQuery) return;
    void loadDimension();
    // The query object is memoized to keep this request tied to the selected dimension.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, dimensionQuery]);

  const selected = charts.find((chart) => chart.id === selectedId);
  const songs = mode === "global" ? (selectedId ? chartSongs : topSongs) : dimensionSongs;
  const subtitle = mode === "global"
    ? selected?.updateFrequency || selected?.name || "飙升榜 · 热门歌曲"
    : dimensionDetail?.name || (mode === "style" ? "城市风格榜" : "城市榜");

  return (
    <Page>
      <PageHeader
        title="排行榜"
        subtitle={subtitle}
        actions={
          <button
            className="icon-button"
            title="刷新榜单"
            onClick={() => void (mode === "global" ? load() : loadDimension())}
            disabled={mode === "global" ? loading || songsLoading : dimensionLoading}
          >
            <RefreshCw size={17} className={(mode === "global" ? loading : dimensionLoading) ? "spin" : ""} />
          </button>
        }
      />
      <div className="collection-tabs chart-tabs" role="tablist" aria-label="榜单类型">
        <button className={mode === "global" ? "active" : ""} onClick={() => setMode("global")}><RefreshCw size={14} /> 官方榜单</button>
        <button className={mode === "city" ? "active" : ""} onClick={() => setMode("city")}><MapPin size={14} /> 城市榜</button>
        <button className={mode === "style" ? "active" : ""} onClick={() => setMode("style")}><Palette size={14} /> 城市风格榜</button>
      </div>
      {mode === "global" && charts.length > 0 && (
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
      {mode !== "global" && (
        <div className="chart-dimension-controls">
          <label>
            城市
            <select value={cityId} onChange={(event) => setCityId(event.target.value)} disabled={!cityOptions.length || dimensionLoading}>
              {cityOptions.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </label>
          {mode === "style" && (
            <label>
              风格
              <select value={styleId} onChange={(event) => setStyleId(event.target.value)} disabled={!styles.length || dimensionLoading}>
                {styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
              </select>
            </label>
          )}
          {dimensionDetail?.description && <small>{dimensionDetail.description}</small>}
        </div>
      )}
      <SongList
        songs={songs}
        loading={mode === "global" ? songsLoading || (!charts.length && topSongsLoading) : dimensionLoading}
        emptyText="暂无排行数据"
      />
    </Page>
  );
}
