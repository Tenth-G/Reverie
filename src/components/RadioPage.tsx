import { useEffect, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import type { BroadcastCategory, RadioInfo } from "../api/types";
import { useExploreStore } from "../store/exploreStore";
import { sizedImage } from "../utils/image";
import { LoadingState, Page, PageHeader } from "./Page";
import SongList from "./SongList";
import {
  getDifmChannels,
  getDifmSubscribedChannels,
  getDifmTracks,
  getPodcastBanners,
  getPodcastCategories,
  getPodcastCategoryRecommendations,
  getPodcastHotRadios,
  getPodcastToplist,
  toggleDifmChannel,
} from "../api/broadcast.ts";
import type { DifmChannel, Song } from "../api/types.ts";
import { usePlayerStore } from "../store/playerStore.ts";

function RadioGrid({ radios }: { radios: RadioInfo[] }) {
  const openRadio = useExploreStore((s) => s.openRadio);
  const toggleSubscription = useExploreStore((s) => s.toggleRadioSubscription);
  return (
    <div className="media-grid">
      {radios.map((radio) => (
        <article
          className="media-card"
          key={radio.id}
          onClick={() => void openRadio(radio.id)}
        >
          <div className="card-cover">
            <img src={sizedImage(radio.picUrl, 360)} alt="" loading="lazy" />
            <button
              className={`media-favorite ${radio.subscribed ? "active" : ""}`}
              title={radio.subscribed ? "取消订阅" : "订阅电台"}
              onClick={(e) => {
                e.stopPropagation();
                void toggleSubscription(radio);
              }}
            >
              <Heart
                size={15}
                fill={radio.subscribed ? "currentColor" : "none"}
              />
            </button>
          </div>
          <strong>{radio.name}</strong>
          <span>
            {radio.category || radio.djName || `${radio.programCount} 期`}
          </span>
        </article>
      ))}
    </div>
  );
}

const DIFM_SOURCES = [
  { id: 0, label: "最嗨电音" },
  { id: 1, label: "古典电台" },
  { id: 2, label: "爵士电台" },
];

function DifmPanel() {
  const playSong = usePlayerStore((state) => state.playSong);
  const [source, setSource] = useState(0);
  const [channels, setChannels] = useState<DifmChannel[]>([]);
  const [selected, setSelected] = useState<DifmChannel | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (nextSource = source) => {
    setLoading(true);
    setError("");
    try {
      const [available, subscribed] = await Promise.all([
        getDifmChannels(nextSource),
        getDifmSubscribedChannels(nextSource),
      ]);
      const subscribedIds = new Set(subscribed.map((item) => item.id));
      const merged = available.map((item) => ({
        ...item,
        subscribed: item.subscribed || subscribedIds.has(item.id),
      }));
      setChannels(merged);
      setSelected((current) => merged.find((item) => item.id === current?.id) ?? merged[0] ?? null);
    } catch (cause) {
      setChannels([]);
      setSelected(null);
      setError(cause instanceof Error ? cause.message : "DIFM 电台加载失败");
    } finally {
      setLoading(false);
    }
  };

  const loadTracks = async (channel: DifmChannel | null) => {
    setSelected(channel);
    if (!channel) {
      setTracks([]);
      return;
    }
    setTracksLoading(true);
    try {
      setTracks(await getDifmTracks(source, channel.id));
    } catch {
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Source changes are handled explicitly by the source buttons below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseSource = (nextSource: number) => {
    setSource(nextSource);
    setTracks([]);
    void load(nextSource);
  };

  const toggle = async (channel: DifmChannel) => {
    try {
      await toggleDifmChannel(channel.id, !channel.subscribed);
      setChannels((items) => items.map((item) => item.id === channel.id ? { ...item, subscribed: !channel.subscribed } : item));
    } catch {
      setError("DIFM 频道收藏操作失败");
    }
  };

  return (
    <section className="difm-section">
      <div className="list-header">
        <h3>DIFM 电台</h3>
        <button className="icon-button" title="刷新 DIFM" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /></button>
      </div>
      <div className="collection-tabs" role="tablist" aria-label="DIFM 来源">
        {DIFM_SOURCES.map((item) => <button key={item.id} className={source === item.id ? "active" : ""} onClick={() => chooseSource(item.id)}>{item.label}</button>)}
      </div>
      {loading ? <LoadingState label="正在加载 DIFM 频道…" /> : channels.length ? (
        <div className="difm-layout">
          <div className="difm-channel-grid">
            {channels.map((channel) => (
              <button className={`difm-channel ${selected?.id === channel.id ? "active" : ""}`} key={channel.id} onClick={() => void loadTracks(channel)}>
                {channel.coverUrl ? <img src={sizedImage(channel.coverUrl, 180)} alt="" /> : <span className="difm-channel-placeholder">DIFM</span>}
                <span>{channel.name}</span>
                <i onClick={(event) => { event.stopPropagation(); void toggle(channel); }} title={channel.subscribed ? "取消收藏" : "收藏频道"}><Heart size={14} fill={channel.subscribed ? "currentColor" : "none"} /></i>
              </button>
            ))}
          </div>
          <div className="difm-tracks">
            {selected ? <SongList songs={tracks} loading={tracksLoading} title={`${selected.name} · 播放列表`} emptyText="暂无播放内容" /> : <div className="empty">选择一个频道查看播放列表</div>}
            {tracks.length > 0 && <button className="btn" onClick={() => void playSong(tracks[0]!, tracks)}>播放当前频道</button>}
          </div>
        </div>
      ) : <div className="empty">暂无 DIFM 频道</div>}
      {error && <div className="broadcast-error" role="alert">{error}</div>}
    </section>
  );
}

export default function RadioPage() {
  const radios = useExploreStore((s) => s.radios);
  const subscribed = useExploreStore((s) => s.subscribedRadios);
  const loading = useExploreStore((s) => s.loading);
  const loadRadios = useExploreStore((s) => s.loadRadios);
  const [ranking, setRanking] = useState<"new" | "hot" | "">("");
  const [ranked, setRanked] = useState<RadioInfo[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [categories, setCategories] = useState<BroadcastCategory[]>([]);
  const [categoryId, setCategoryId] = useState(0);
  const [categoryRadios, setCategoryRadios] = useState<RadioInfo[]>([]);
  const [hotRadios, setHotRadios] = useState<RadioInfo[]>([]);
  const [banners, setBanners] = useState<Array<{ imageUrl: string; title: string; url: string }>>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  useEffect(() => {
    void loadRadios();
  }, [loadRadios]);

  useEffect(() => {
    let alive = true;
    setDiscoveryLoading(true);
    void Promise.all([getPodcastCategories(), getPodcastHotRadios(), getPodcastBanners()])
      .then(([nextCategories, nextHot, nextBanners]) => {
        if (!alive) return;
        setCategories(nextCategories);
        setHotRadios(nextHot);
        setBanners(nextBanners);
      })
      .catch(() => {
        if (alive) setCategories([]);
      })
      .finally(() => {
        if (alive) setDiscoveryLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const loadCategory = async (id: number) => {
    setCategoryId(id);
    if (!id) { setCategoryRadios([]); return; }
    setDiscoveryLoading(true);
    try { setCategoryRadios(await getPodcastCategoryRecommendations(id)); }
    catch { setCategoryRadios([]); }
    finally { setDiscoveryLoading(false); }
  };

  const loadRanking = async (type: "new" | "hot") => {
    setRanking(type);
    setRankingLoading(true);
    try {
      setRanked(await getPodcastToplist(type));
    } catch {
      setRanked([]);
    } finally {
      setRankingLoading(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="播客与电台"
        subtitle="精选节目、声音内容和已订阅电台"
        actions={<button className="btn" onClick={() => void loadCategory(categoryId)} disabled={discoveryLoading}><RefreshCw size={15} /> 刷新</button>}
      />
      {banners.length > 0 && <div className="podcast-banner-strip">{banners.slice(0, 4).map((banner) => <button key={`${banner.imageUrl}-${banner.title}`} onClick={() => banner.url && window.open(banner.url, "_blank", "noopener,noreferrer")}><img src={sizedImage(banner.imageUrl, 720)} alt="" /><span>{banner.title}</span></button>)}</div>}
      <DifmPanel />
      <div className="podcast-category-strip" role="tablist" aria-label="播客分类">
        <button className={!categoryId ? "active" : ""} onClick={() => void loadCategory(0)}>精选</button>
        {categories.map((category) => <button key={category.id} className={categoryId === category.id ? "active" : ""} onClick={() => void loadCategory(category.id)}>{category.name}</button>)}
      </div>
      {categoryId > 0 && <section className="content-section"><div className="list-header"><h3>分类精选</h3><span className="count">{categoryRadios.length} 个</span></div>{discoveryLoading ? <LoadingState label="正在加载分类电台…" /> : <RadioGrid radios={categoryRadios} />}</section>}
      {!categoryId && hotRadios.length > 0 && <section className="content-section"><div className="list-header"><h3>热门电台</h3><span className="count">{hotRadios.length} 个</span></div><RadioGrid radios={hotRadios} /></section>}
      <div className="collection-tabs" role="tablist" aria-label="播客榜单">
        <button className={ranking === "new" ? "active" : ""} onClick={() => void loadRanking("new")}>新晋电台榜</button>
        <button className={ranking === "hot" ? "active" : ""} onClick={() => void loadRanking("hot")}>热门电台榜</button>
      </div>
      {ranking && (
        <section className="content-section">
          <div className="list-header">
            <h3>{ranking === "new" ? "新晋电台榜" : "热门电台榜"}</h3>
            <span className="count">{ranked.length} 个</span>
          </div>
          {rankingLoading ? <LoadingState label="正在加载播客榜单…" /> : <RadioGrid radios={ranked} />}
        </section>
      )}
      {subscribed.length > 0 && (
        <section className="content-section">
          <div className="list-header">
            <h3>我的订阅</h3>
            <span className="count">{subscribed.length} 个</span>
          </div>
          <RadioGrid radios={subscribed} />
        </section>
      )}
      <section className="content-section">
        <div className="list-header">
          <h3>精选推荐</h3>
          <span className="count">{radios.length} 个</span>
        </div>
        {radios.length ? (
          <RadioGrid radios={radios} />
        ) : loading ? (
          <LoadingState label="正在加载播客与电台…" />
        ) : (
          <div className="empty">暂无推荐电台</div>
        )}
      </section>
    </Page>
  );
}
