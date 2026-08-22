import { useEffect, useMemo, useState } from "react";
import { MapPin, Palette, RefreshCw, UserRound } from "lucide-react";
import {
  getArtistToplist,
  getChartCities,
  getDimensionChartDetail,
  getDimensionChartSongs,
  type DimensionChartQuery,
} from "../api/charts";
import { getStyleTags } from "../api/style";
import type { ArtistInfo, ChartCity, DimensionChartDetail, Song, StyleTag } from "../api/types";
import { useExploreStore } from "../store/exploreStore";
import { sizedImage } from "../utils/image";
import { usePlayerStore } from "../store/playerStore";
import { useChartStore } from "../store/chartStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";

type ChartMode = "global" | "city" | "style" | "artist";

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
  const [artistType, setArtistType] = useState(1);
  const [artistRanks, setArtistRanks] = useState<ArtistInfo[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const topSongs = usePlayerStore((s) => s.topSongs);
  const topSongsLoading = usePlayerStore((s) => s.topSongsLoading);
  const charts = useChartStore((s) => s.charts);
  const selectedId = useChartStore((s) => s.selectedId);
  const chartSongs = useChartStore((s) => s.songs);
  const loading = useChartStore((s) => s.loading);
  const songsLoading = useChartStore((s) => s.songsLoading);
  const load = useChartStore((s) => s.load);
  const select = useChartStore((s) => s.select);
  const openArtist = useExploreStore((s) => s.openArtist);
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

  const loadArtist = async (type = artistType) => {
    setArtistLoading(true);
    try {
      setArtistRanks(await getArtistToplist(type));
    } catch {
      setArtistRanks([]);
      usePlayerStore.getState().toast("加载歌手榜失败", "error");
    } finally {
      setArtistLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "global" || !dimensionQuery) return;
    void loadDimension();
    // The query object is memoized to keep this request tied to the selected dimension.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, dimensionQuery]);

  useEffect(() => {
    if (mode === "artist") void loadArtist();
    // Artist type changes are handled by the selector below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const selected = charts.find((chart) => chart.id === selectedId);
  const songs = mode === "global" ? (selectedId ? chartSongs : topSongs) : dimensionSongs;
  const subtitle = mode === "global"
    ? selected?.updateFrequency || selected?.name || "飙升榜 · 热门歌曲"
    : mode === "artist" ? "歌手榜"
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
            onClick={() => void (mode === "global" ? load() : mode === "artist" ? loadArtist() : loadDimension())}
            disabled={mode === "global" ? loading || songsLoading : mode === "artist" ? artistLoading : dimensionLoading}
          >
            <RefreshCw size={17} className={(mode === "global" ? loading : mode === "artist" ? artistLoading : dimensionLoading) ? "spin" : ""} />
          </button>
        }
      />
      <div className="collection-tabs chart-tabs" role="tablist" aria-label="榜单类型">
        <button className={mode === "global" ? "active" : ""} onClick={() => setMode("global")}><RefreshCw size={14} /> 官方榜单</button>
        <button className={mode === "artist" ? "active" : ""} onClick={() => setMode("artist")}><UserRound size={14} /> 歌手榜</button>
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
      {(mode === "city" || mode === "style") && (
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
      {mode === "artist" ? (
        <>
          <div className="chart-dimension-controls">
            <label>
              地区
              <select value={artistType} onChange={(event) => { const type = Number(event.target.value); setArtistType(type); void loadArtist(type); }} disabled={artistLoading}>
                <option value={1}>华语</option><option value={2}>欧美</option><option value={3}>韩国</option><option value={4}>日本</option>
              </select>
            </label>
          </div>
          {artistLoading ? <div className="loading-hint">正在加载歌手榜…</div> : artistRanks.length ? (
            <div className="artist-ranking-grid">
              {artistRanks.map((item, index) => (
                <button className="artist-ranking-card" key={item.id} onClick={() => void openArtist(item.id)}>
                  <b>{index + 1}</b>
                  {item.picUrl ? <img src={sizedImage(item.picUrl, 180)} alt="" loading="lazy" /> : <span><UserRound size={20} /></span>}
                  <strong>{item.name}</strong>
                  <small>{item.musicSize ? `${item.musicSize} 首歌曲` : "歌手"}</small>
                </button>
              ))}
            </div>
          ) : <div className="empty">暂无歌手榜数据</div>}
        </>
      ) : (
        <SongList
          songs={songs}
          loading={mode === "global" ? songsLoading || (!charts.length && topSongsLoading) : dimensionLoading}
          emptyText="暂无排行数据"
        />
      )}
    </Page>
  );
}
