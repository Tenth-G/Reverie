import { request } from "./client.ts";
import type { VipGrowthEntry, VipGrowthInfo, VipTask } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export async function getVipGrowth(): Promise<VipGrowthInfo> {
  const response = await request<Obj>("/vip/growthpoint", {}, false);
  const value = obj(response.data ?? response);
  const growth = Number(
    value.growth ?? value.growthPoint ?? value.current ?? 0,
  );
  const next = Number(
    value.nextLevelGrowth ?? value.next ?? value.levelUpGrowth ?? 0,
  );
  return {
    level: Number(value.level ?? value.vipLevel ?? 0),
    growth,
    nextLevelGrowth: next,
    progress: next > 0 ? Math.min(1, growth / next) : 0,
    expireTime: Number(value.expireTime ?? value.endTime ?? 0),
  };
}

export async function getVipTasks(): Promise<VipTask[]> {
  const response = await request<Obj>("/vip/tasks", {}, false);
  return arr(response.data ?? response.list ?? response.tasks)
    .map((raw) => {
      const value = obj(raw);
      return {
        id: String(value.id ?? value.taskId ?? ""),
        name: String(value.name ?? value.taskName ?? "会员任务"),
        description: String(value.description ?? value.desc ?? ""),
        reward: Number(value.reward ?? value.growth ?? value.growthPoint ?? 0),
        completed: Boolean(
          value.completed ??
          value.finish ??
          value.done ??
          (value.status === "done" || value.status === "claimed"),
        ),
        claimed: Boolean(
          value.claimed ??
          value.received ??
          value.rewardClaimed ??
          value.status === "claimed",
        ),
      } satisfies VipTask;
    })
    .filter((task) => task.id);
}

export async function getVipGrowthDetails(
  limit = 20,
  offset = 0,
): Promise<VipGrowthEntry[]> {
  const response = await request<Obj>(
    "/vip/growthpoint/details",
    { limit, offset },
    false,
  );
  return arr(response.data ?? response.list ?? response.records).map(
    (raw, index) => {
      const value = obj(raw);
      return {
        id: String(value.id ?? value.recordId ?? `${offset + index}`),
        title: String(
          value.reason ?? value.description ?? value.name ?? "成长值记录",
        ),
        amount: Number(value.amount ?? value.growth ?? value.growthPoint ?? 0),
        time: Number(value.time ?? value.createTime ?? 0),
      } satisfies VipGrowthEntry;
    },
  );
}

export async function getVipTimeMachine(
  startTime?: number,
  endTime?: number,
): Promise<Obj> {
  const params =
    startTime && endTime ? { startTime, endTime, type: 1, limit: 60 } : {};
  return request<Obj>("/vip/timemachine", params, false);
}

export async function getVipGrowthpointInfo(): Promise<Obj> {
  return request<Obj>("/vip/growthpoint/get", {}, false);
}

export async function claimVipTaskRewards(taskIds: string[]): Promise<void> {
  if (!taskIds.length) return;
  await request(
    "/vip/growthpoint/reward/get",
    { ids: taskIds.join(",") },
    false,
    { method: "POST" },
  );
}
