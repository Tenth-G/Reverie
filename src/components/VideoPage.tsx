import { useEffect } from "react";
import { Clapperboard, RefreshCw } from "lucide-react";
import { useVideoStore } from "../store/videoStore.ts";
import { useMediaStore } from "../store/mediaStore.ts";
import { Page, PageHeader } from "./Page";
import { sizedImage } from "../utils/image";

export default function VideoPage() {
  const mode = useVideoStore((s) => s.mode);
  const groups = useVideoStore((s) => s.groups);
  const selectedGroup = useVideoStore((s) => s.selectedGroup);
  const videos = useVideoStore((s) => s.videos);
  const loading = useVideoStore((s) => s.loading);
  const load = useVideoStore((s) => s.load);
  const setMode = useVideoStore((s) => s.setMode);
  const selectGroup = useVideoStore((s) => s.selectGroup);
  const openMedia = useMediaStore((s) => s.open);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader
        title="视频中心"
        subtitle="推荐、全部与分类视频"
        actions={
          <button className="icon-button" title="刷新视频" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        }
      />
      <div className="collection-tabs" role="tablist" aria-label="视频分类">
        <button className={mode === "recommend" ? "active" : ""} onClick={() => void setMode("recommend")}>推荐</button>
        <button className={mode === "all" ? "active" : ""} onClick={() => void setMode("all")}>全部</button>
        {groups.map((group) => (
          <button key={group.id} className={mode === "group" && selectedGroup === group.id ? "active" : ""} onClick={() => void selectGroup(group.id)}>{group.name}</button>
        ))}
      </div>
      {loading && !videos.length ? (
        <div className="loading-hint">正在加载视频…</div>
      ) : videos.length ? (
        <div className="media-grid video-grid">
          {videos.map((video) => (
            <button className="media-card video-card" key={video.id} onClick={() => void openMedia(video)}>
              <span className="card-cover">
                {video.coverUrl ? <img src={sizedImage(video.coverUrl, 360)} alt="" loading="lazy" /> : <Clapperboard size={28} />}
              </span>
              <strong>{video.name}</strong>
              <span>{video.creatorName || "网易云视频"}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty">暂无视频内容</div>
      )}
    </Page>
  );
}
