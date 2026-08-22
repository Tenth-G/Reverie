import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, ExternalLink, RefreshCw } from "lucide-react";
import { getCalendar } from "../api/calendar.ts";
import type { CalendarEvent } from "../api/types.ts";
import { LoadingState, Page, PageHeader } from "./Page";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateInput(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function fromDateInput(value: string, endOfDay = false): number {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function initialRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function formatEventTime(value: number): string {
  if (!value) return "时间待定";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CalendarPage() {
  const defaults = useMemo(initialRange, []);
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!start || !end) return;
    const startTime = fromDateInput(start);
    const endTime = fromDateInput(end, true);
    if (startTime > endTime) {
      setError("开始日期不能晚于结束日期");
      setEvents([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setEvents(await getCalendar(startTime, endTime));
    } catch (cause) {
      setEvents([]);
      setError(cause instanceof Error ? cause.message : "音乐日历加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Initial range is intentionally loaded once; later changes use the query button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page>
      <PageHeader
        title="音乐日历"
        subtitle="查看指定日期范围内的音乐活动与纪念日"
        actions={
          <button
            className="icon-button"
            title="刷新日历"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        }
      />
      <div className="calendar-query" role="search">
        <label>
          <span>开始日期</span>
          <input
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <span className="calendar-query-separator">至</span>
        <label>
          <span>结束日期</span>
          <input
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
        <button
          className="primary-button"
          onClick={() => void load()}
          disabled={loading}
        >
          查询
        </button>
      </div>
      {loading ? (
        <LoadingState label="正在加载音乐日历…" />
      ) : events.length ? (
        <div className="calendar-list">
          {events.map((event) => (
            <article className="calendar-event" key={event.id}>
              {event.coverUrl ? (
                <img src={event.coverUrl} alt="" />
              ) : (
                <span className="calendar-event-cover">
                  <CalendarDays size={21} />
                </span>
              )}
              <div className="calendar-event-body">
                <div className="calendar-event-meta">
                  <span>
                    <Clock3 size={13} />
                    {formatEventTime(event.startTime)}
                    {event.endTime > event.startTime &&
                      ` - ${formatEventTime(event.endTime)}`}
                  </span>
                  {event.category && <b>{event.category}</b>}
                </div>
                <h2>{event.title}</h2>
                {event.description && <p>{event.description}</p>}
                {(event.resourceId || event.resourceType) && (
                  <small>
                    {event.resourceType || "相关资源"}
                    {event.resourceId ? ` · ${event.resourceId}` : ""}
                  </small>
                )}
              </div>
              {event.resourceUrl && (
                <a
                  className="icon-button"
                  href={event.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="打开相关资源"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="calendar-empty">
          <CalendarDays size={24} />
          <strong>该日期范围暂无音乐日历</strong>
          <span>可以扩大日期范围后重新查询</span>
        </div>
      )}
      {error && (
        <div className="calendar-error" role="alert">
          {error}
        </div>
      )}
    </Page>
  );
}
