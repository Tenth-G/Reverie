import { create } from "zustand";
import {
  getVipGrowth,
  getVipGrowthDetails,
  getVipTasks,
  getVipTimeMachine,
} from "../api/vip.ts";
import type { VipGrowthEntry, VipGrowthInfo, VipTask } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface VipState {
  growth: VipGrowthInfo | null;
  tasks: VipTask[];
  details: VipGrowthEntry[];
  timeMachine: Record<string, unknown> | null;
  loading: boolean;
  load: () => Promise<void>;
}

export const useVipStore = create<VipState>()((set) => ({
  growth: null,
  tasks: [],
  details: [],
  timeMachine: null,
  loading: false,
  load: async () => {
    set({ loading: true });
    const [growth, tasks, details, timeMachine] = await Promise.allSettled([
      getVipGrowth(),
      getVipTasks(),
      getVipGrowthDetails(),
      getVipTimeMachine(),
    ]);
    set({
      growth: growth.status === "fulfilled" ? growth.value : null,
      tasks: tasks.status === "fulfilled" ? tasks.value : [],
      details: details.status === "fulfilled" ? details.value : [],
      timeMachine:
        timeMachine.status === "fulfilled" ? timeMachine.value : null,
      loading: false,
    });
    if (growth.status === "rejected")
      usePlayerStore
        .getState()
        .toast("加载会员中心失败，请确认登录状态", "error");
  },
}));
