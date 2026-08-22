import { useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { useRecommendHistoryStore } from "../store/recommendHistoryStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";
import SongList from "./SongList";

export default function RecommendHistoryPage() {
  const days = useRecommendHistoryStore((state) => state.days);
  const selectedDate = useRecommendHistoryStore((state) => state.selectedDate);
  const songs = useRecommendHistoryStore((state) => state.songs);
  const loading = useRecommendHistoryStore((state) => state.loading);
  const detailLoading = useRecommendHistoryStore(
    (state) => state.detailLoading,
  );
  const load = useRecommendHistoryStore((state) => state.load);
  const selectDate = useRecommendHistoryStore((state) => state.selectDate);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader title="每日推荐历史" subtitle="查看过去的每日推荐歌曲" />
      {loading ? (
        <LoadingState label="正在加载推荐日期…" />
      ) : !days.length ? (
        <div className="empty">暂无推荐历史</div>
      ) : (
        <>
          <div className="recommend-history-days">
            {days.map((day) => (
              <button
                key={day.date}
                className={selectedDate === day.date ? "active" : ""}
                onClick={() => void selectDate(day.date)}
              >
                <CalendarDays size={15} />
                <span>{day.displayDate}</span>
                <small>
                  {day.songCount ? `${day.songCount} 首` : "推荐歌曲"}
                </small>
              </button>
            ))}
          </div>
          {detailLoading ? (
            <LoadingState label="正在加载当日歌曲…" />
          ) : (
            <SongList songs={songs} emptyText="该日暂无推荐歌曲" />
          )}
        </>
      )}
    </Page>
  );
}
