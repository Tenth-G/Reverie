import { request } from "./client.ts";
import type { CalendarEvent } from "./types.ts";

type Obj = Record<string, unknown>;

const obj = (value: unknown): Obj =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Obj)
    : {};

const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeEvent(raw: unknown, index: number): CalendarEvent | null {
  const value = obj(raw);
  const resource = obj(value.resource);
  const startTime = Number(
    value.startTime ?? value.start ?? value.publishTime ?? 0,
  );
  const endTime = Number(value.endTime ?? value.end ?? startTime);
  const resourceId = Number(
    value.resourceId ?? resource.id ?? value.id ?? value.targetId ?? 0,
  );
  const title = String(
    value.title ?? value.name ?? value.eventTitle ?? "音乐日历事件",
  ).trim();
  if (!title && !startTime) return null;
  return {
    id: String(value.id ?? value.eventId ?? `${startTime}-${index}`),
    title: title || "音乐日历事件",
    description: String(value.description ?? value.desc ?? value.content ?? ""),
    startTime,
    endTime,
    eventType: String(value.eventType ?? value.type ?? ""),
    category: String(value.category ?? value.tag ?? value.calendarType ?? ""),
    coverUrl: String(
      value.coverUrl ?? value.picUrl ?? value.cover ?? resource.coverUrl ?? "",
    ),
    resourceId,
    resourceType: String(value.resourceType ?? resource.type ?? ""),
    resourceUrl: String(value.resourceUrl ?? value.url ?? resource.url ?? ""),
  };
}

export async function getCalendar(
  startTime: number,
  endTime: number,
): Promise<CalendarEvent[]> {
  const response = await request<Obj>(
    "/calendar",
    { startTime, endTime },
    false,
  );
  const value = obj(response.data ?? response.result ?? response);
  return arr(
    value.calendar ?? value.events ?? value.list ?? response.data ?? response,
  )
    .map((item, index) => normalizeEvent(item, index))
    .filter((item): item is CalendarEvent => item !== null)
    .sort((a, b) => a.startTime - b.startTime);
}
