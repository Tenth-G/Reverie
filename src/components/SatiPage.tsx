import { useEffect } from "react";
import { Heart, Headphones, RefreshCw, Sparkles } from "lucide-react";
import { useSatiStore } from "../store/satiStore.ts";
import { sizedImage } from "../utils/image";
import { LoadingState, Page, PageHeader } from "./Page";

export default function SatiPage() {
  const tags = useSatiStore((s) => s.tags);
  const selectedTag = useSatiStore((s) => s.selectedTag);
  const resources = useSatiStore((s) => s.resources);
  const subscribed = useSatiStore((s) => s.subscribed);
  const loading = useSatiStore((s) => s.loading);
  const error = useSatiStore((s) => s.error);
  const load = useSatiStore((s) => s.load);
  const selectTag = useSatiStore((s) => s.selectTag);
  const toggle = useSatiStore((s) => s.toggle);
  const loadMore = useSatiStore((s) => s.loadMore);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader
        title="助眠与解压"
        subtitle="按场景发现声音资源，收藏喜欢的内容"
        actions={
          <button
            className="icon-button"
            title="刷新"
            onClick={() => void load()}
          >
            <RefreshCw size={17} />
          </button>
        }
      />
      <div className="sati-layout">
        <aside className="sati-tags">
          <strong>主题</strong>
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={selectedTag === tag.id ? "active" : ""}
              onClick={() => void selectTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </aside>
        <main className="sati-main">
          {subscribed.length > 0 && (
            <section className="sati-section">
              <div className="sati-section-head">
                <h2>我的收藏</h2>
                <span>{subscribed.length}</span>
              </div>
              <ResourceGrid
                resources={subscribed}
                onToggle={toggle}
                onMore={loadMore}
              />
            </section>
          )}
          <section className="sati-section">
            <div className="sati-section-head">
              <h2>
                <Sparkles size={16} />
                推荐资源
              </h2>
              <span>{resources.length}</span>
            </div>
            {loading && !resources.length ? (
              <LoadingState label="正在加载声音资源…" />
            ) : resources.length ? (
              <ResourceGrid
                resources={resources}
                onToggle={toggle}
                onMore={loadMore}
              />
            ) : (
              <div className="sati-empty">暂无资源</div>
            )}
          </section>
        </main>
      </div>
      {error && (
        <div className="sati-error" role="alert">
          {error}
        </div>
      )}
    </Page>
  );
}

function ResourceGrid({
  resources,
  onToggle,
  onMore,
}: {
  resources: import("../api/types.ts").SatiResource[];
  onToggle: (resource: import("../api/types.ts").SatiResource) => void;
  onMore: (resource: import("../api/types.ts").SatiResource) => void;
}) {
  return (
    <div className="sati-grid">
      {resources.map((resource) => (
        <article className="sati-card" key={resource.id}>
          {resource.coverUrl ? (
            <img src={sizedImage(resource.coverUrl, 220)} alt="" />
          ) : (
            <span className="sati-cover">
              <Headphones size={24} />
            </span>
          )}
          <strong>{resource.name}</strong>
          <small>
            {resource.description ||
              `${resource.playCount.toLocaleString("zh-CN")} 次播放`}
          </small>
          <div>
            <button
              className={`icon-button ${resource.subscribed ? "active" : ""}`}
              title={resource.subscribed ? "取消收藏" : "收藏"}
              onClick={() => onToggle(resource)}
            >
              <Heart
                size={15}
                fill={resource.subscribed ? "currentColor" : "none"}
              />
            </button>
            <button
              className="secondary-button"
              onClick={() => onMore(resource)}
            >
              更多推荐
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
