import { create } from "zustand";
import {
  getMusicianCloudbean,
  getMusicianOverview,
  getMusicianPlayTrend,
  getMusicianStageTasks,
  getMusicianTasks,
  musicianSign,
  obtainMusicianCloudbean,
} from "../api/musician.ts";
import type {
  MusicianOverview,
  MusicianTask,
  MusicianTrendPoint,
} from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface MusicianState {
  cloudbean: number;
  overview: MusicianOverview | null;
  trend: MusicianTrendPoint[];
  tasks: MusicianTask[];
  loading: boolean;
  signing: boolean;
  claimingId: number;
  error: string;
  load: () => Promise<void>;
  sign: () => Promise<void>;
  claim: (task: MusicianTask) => Promise<void>;
}

export const useMusicianStore = create<MusicianState>((set, get) => ({
  cloudbean: 0,
  overview: null,
  trend: [],
  tasks: [],
  loading: false,
  signing: false,
  claimingId: 0,
  error: "",
  load: async () => {
    set({ loading: true, error: "" });
    const [cloudbean, overview, trend, tasks, stage] = await Promise.allSettled(
      [
        getMusicianCloudbean(),
        getMusicianOverview(),
        getMusicianPlayTrend(),
        getMusicianTasks(),
        getMusicianStageTasks(),
      ],
    );
    const taskList =
      tasks.status === "fulfilled"
        ? tasks.value
        : stage.status === "fulfilled"
          ? stage.value
          : [];
    set({
      cloudbean: cloudbean.status === "fulfilled" ? cloudbean.value : 0,
      overview: overview.status === "fulfilled" ? overview.value : null,
      trend: trend.status === "fulfilled" ? trend.value : [],
      tasks: taskList,
      loading: false,
      error:
        cloudbean.status === "rejected" && overview.status === "rejected"
          ? "音乐人数据暂时不可用"
          : "",
    });
  },
  sign: async () => {
    if (get().signing) return;
    set({ signing: true, error: "" });
    try {
      await musicianSign();
      usePlayerStore.getState().toast("音乐人签到成功", "success");
      await get().load();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "音乐人签到失败" });
    } finally {
      set({ signing: false });
    }
  },
  claim: async (task) => {
    const id = task.userMissionId ?? task.id;
    if (!id || get().claimingId) return;
    set({ claimingId: id, error: "" });
    try {
      await obtainMusicianCloudbean(id, task.period);
      set({
        tasks: get().tasks.map((item) =>
          item.id === task.id ? { ...item, status: "claimed" } : item,
        ),
        claimingId: 0,
      });
      usePlayerStore.getState().toast("云豆已领取", "success");
    } catch (error) {
      set({
        claimingId: 0,
        error: error instanceof Error ? error.message : "领取云豆失败",
      });
    }
  },
}));
