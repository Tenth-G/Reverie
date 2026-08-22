import { useEffect, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import type { BroadcastCategory, RadioInfo } from "../api/types";
import { useExploreStore } from "../store/exploreStore";
import { sizedImage } from "../utils/image";
import { LoadingState, Page, PageHeader } from "./Page";
import { getPodcastBanners, getPodcastCategories, getPodcastCategoryRecommendations, getPodcastHotRadios, getPodcastToplist } from "../api/broadcast.ts";

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
