import { useEffect } from "react";
import { Download, ShoppingBag } from "lucide-react";
import { useDownloadHistoryStore } from "../store/downloadHistoryStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";
import SongList from "./SongList";

const TABS = [
  ["all", "全部下载"],
  ["month", "本月下载"],
  ["purchased", "已购歌曲"],
  ["singlePurchased", "已购单曲"],
] as const;

export default function DownloadHistoryPage() {
  const category = useDownloadHistoryStore((state) => state.category);
  const songs = useDownloadHistoryStore((state) => state.songs);
  const loading = useDownloadHistoryStore((state) => state.loading);
  const setCategory = useDownloadHistoryStore((state) => state.setCategory);
  const load = useDownloadHistoryStore((state) => state.load);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader
        title="下载与购买"
        subtitle="会员下载和已购歌曲"
        actions={
          category === "purchased" ? (
            <ShoppingBag size={17} />
          ) : (
            <Download size={17} />
          )
        }
      />
      <div className="collection-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={category === id ? "active" : ""}
            onClick={() => void setCategory(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <LoadingState label="正在加载记录…" />
      ) : (
        <SongList songs={songs} emptyText="暂无记录" />
      )}
    </Page>
  );
}
