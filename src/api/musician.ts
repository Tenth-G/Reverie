import { request } from "./client.ts";
import type {
  MusicianOverview,
  MusicianTask,
  MusicianTrendPoint,
} from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export async function getMusicianCloudbean(): Promise<number> {
  const response = await request<Obj>("/musician/cloudbean", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return Number(
    value.cloudbean ?? value.cloudBean ?? value.balance ?? value.point ?? 0,
  );
}

export async function obtainMusicianCloudbean(
  userMissionId: number,
  period?: string,
): Promise<void> {
  await request(
    "/musician/cloudbean/obtain",
    { id: userMissionId, period },
    false,
    { method: "POST" },
  );
}

export async function getMusicianOverview(): Promise<MusicianOverview> {
  const response = await request<Obj>("/musician/data/overview", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return {
    songCount: Number(value.songCount ?? value.musicCount ?? 0),
    playCount: Number(value.playCount ?? value.listenCount ?? 0),
    fanCount: Number(value.fanCount ?? value.followCount ?? 0),
    commentCount: Number(value.commentCount ?? 0),
    cloudbean: Number(value.cloudbean ?? value.cloudBean ?? 0),
  };
}

export async function getMusicianPlayTrend(
  startTime?: number,
  endTime?: number,
): Promise<MusicianTrendPoint[]> {
  const response = await request<Obj>(
    "/musician/play/trend",
    { startTime, endTime },
    false,
  );
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.records ?? value).map((item) => {
    const row = obj(item);
    return {
      date: String(row.date ?? row.time ?? row.day ?? ""),
      count: Number(row.count ?? row.playCount ?? row.value ?? 0),
    } satisfies MusicianTrendPoint;
  });
}

export async function musicianSign(): Promise<void> {
  await request("/musician/sign", {}, false, { method: "POST" });
}

function normalizeTasks(response: Obj): MusicianTask[] {
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.tasks ?? value)
    .map((item) => {
      const row = obj(item);
      return {
        id: Number(row.id ?? row.taskId ?? row.userMissionId ?? 0),
        name: String(row.name ?? row.taskName ?? "音乐人任务"),
        description: String(row.description ?? row.desc ?? ""),
        reward: Number(row.reward ?? row.cloudbean ?? row.point ?? 0),
        status: String(row.status ?? row.taskStatus ?? "todo"),
        userMissionId: Number(row.userMissionId ?? row.id ?? 0) || undefined,
        period: String(row.period ?? "") || undefined,
      } satisfies MusicianTask;
    })
    .filter((item) => item.id > 0);
}

export async function getMusicianTasks(): Promise<MusicianTask[]> {
  const response = await request<Obj>("/musician/tasks", {}, false);
  return normalizeTasks(response);
}

export async function getMusicianStageTasks(): Promise<MusicianTask[]> {
  const response = await request<Obj>("/musician/tasks/new", {}, false);
  return normalizeTasks(response);
}
