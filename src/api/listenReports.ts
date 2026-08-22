import { request } from "./client.ts";
import type {
  ListenReport,
  ListenTodaySong,
  ListenTotal,
  VipTimeMachineEntry,
} from "./types.ts";
type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
export async function getListenTotal(): Promise<ListenTotal> {
  const response = await request<Obj>("/listen/data/total", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return {
    duration: Number(value.duration ?? value.totalDuration ?? 0),
    songCount: Number(value.songCount ?? value.totalSong ?? 0),
    playCount: Number(value.playCount ?? value.totalPlay ?? 0),
  };
}
export async function getListenRealtime(
  type: "week" | "month" = "week",
): Promise<ListenReport> {
  const response = await request<Obj>(
    "/listen/data/realtime/report",
    { type },
    false,
  );
  return report(response);
}
export async function getListenReport(
  type: "week" | "month" | "year" = "week",
  endTime?: number,
): Promise<ListenReport> {
  const response = await request<Obj>(
    "/listen/data/report",
    { type, endTime },
    false,
  );
  return report(response);
}
export async function getListenTodaySongs(): Promise<ListenTodaySong[]> {
  const response = await request<Obj>("/listen/data/today/song", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.songs ?? response.data ?? response)
    .map((item) => {
      const row = obj(item);
      return {
        id: Number(row.id ?? row.songId ?? 0),
        name: String(row.name ?? row.songName ?? ""),
        artists: String(row.artists ?? row.artistName ?? ""),
        count: Number(row.count ?? row.playCount ?? 0),
        coverUrl: String(row.picUrl ?? row.coverUrl ?? ""),
      };
    })
    .filter((item) => item.id > 0);
}
export async function getListenYearReport(): Promise<unknown> {
  const response = await request<Obj>("/listen/data/year/report", {}, false);
  return response.data ?? response.result ?? response;
}
export async function getAnnualSummary(year: number): Promise<unknown> {
  const response = await request<Obj>("/summary/annual", { year }, false);
  return response.data ?? response.result ?? response;
}
export async function getListenTimeMachine(
  startTime?: number,
  endTime?: number,
  limit = 60,
): Promise<VipTimeMachineEntry[]> {
  const response = await request<Obj>(
    "/vip/timemachine",
    { startTime, endTime, limit },
    false,
  );
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.records ?? response.data ?? response).map(
    (item) => {
      const row = obj(item);
      return {
        date: String(row.date ?? row.time ?? ""),
        songName: String(row.songName ?? row.name ?? ""),
        artistName: String(row.artistName ?? row.artist ?? ""),
        count: Number(row.count ?? row.playCount ?? 0),
      };
    },
  );
}
function report(response: Obj): ListenReport {
  const value = obj(response.data ?? response.result ?? response);
  return {
    duration: Number(value.duration ?? value.listenDuration ?? 0),
    songCount: Number(value.songCount ?? value.totalSong ?? 0),
    playCount: Number(value.playCount ?? value.totalPlay ?? 0),
    startDate: String(value.startDate ?? ""),
    endDate: String(value.endDate ?? ""),
  };
}
