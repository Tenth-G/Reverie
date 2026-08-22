import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useCommentHistoryStore } from "../store/commentHistoryStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";

function formatTime(value: number) {
  return value
    ? new Date(value < 1e12 ? value * 1000 : value).toLocaleString("zh-CN")
    : "时间未知";
}

export default function CommentHistoryPage() {
  const items = useCommentHistoryStore((state) => state.items);
  const loading = useCommentHistoryStore((state) => state.loading);
  const load = useCommentHistoryStore((state) => state.load);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader title="我的评论" subtitle={`${items.length} 条历史评论`} />
      {loading ? (
        <LoadingState label="正在加载评论历史…" />
      ) : items.length ? (
        <div className="comment-history-list">
          {items.map((item) => (
            <article key={`${item.id}-${item.time}`}>
              <span className="comment-history-icon">
                <MessageCircle size={16} />
              </span>
              <div>
                <p>{item.content}</p>
                <strong>{item.resourceTitle}</strong>
                <time>{formatTime(item.time)}</time>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">暂无评论历史</div>
      )}
    </Page>
  );
}
