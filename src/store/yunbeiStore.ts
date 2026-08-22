import { create } from "zustand";
import {
  dailySignIn,
  finishYunbeiTask,
  getYunbeiLedger,
  getYunbeiOverview,
  getYunbeiTasks,
  getYunbeiTodo,
  yunbeiSign,
} from "../api/yunbei.ts";
import type {
  YunbeiLedgerEntry,
  YunbeiOverview,
  YunbeiTask,
} from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface YunbeiState {
  overview: YunbeiOverview | null;
  tasks: YunbeiTask[];
  ledger: YunbeiLedgerEntry[];
  ledgerType: "income" | "expense";
  loading: boolean;
  taskLoading: boolean;
  ledgerLoading: boolean;
  signing: boolean;
  claimingId: number;
  load: () => Promise<void>;
  sign: () => Promise<boolean>;
  claim: (task: YunbeiTask) => Promise<boolean>;
  setLedgerType: (type: "income" | "expense") => Promise<void>;
}

function toast(message: string, type: "info" | "error" | "success" = "info") {
  usePlayerStore.getState().toast(message, type);
}

export const useYunbeiStore = create<YunbeiState>()((set, get) => ({
  overview: null,
  tasks: [],
  ledger: [],
  ledgerType: "income",
  loading: false,
  taskLoading: false,
  ledgerLoading: false,
  signing: false,
  claimingId: 0,

  load: async () => {
    set({ loading: true, taskLoading: true, ledgerLoading: true });
    const [overview, tasks, todo, ledger] = await Promise.allSettled([
      getYunbeiOverview(),
      getYunbeiTasks(),
      getYunbeiTodo(),
      getYunbeiLedger(get().ledgerType),
    ]);
    set({
      overview: overview.status === "fulfilled" ? overview.value : null,
      tasks:
        tasks.status === "fulfilled"
          ? tasks.value
          : todo.status === "fulfilled"
            ? todo.value
            : [],
      ledger: ledger.status === "fulfilled" ? ledger.value : [],
      loading: false,
      taskLoading: false,
      ledgerLoading: false,
    });
    if (overview.status === "rejected" && tasks.status === "rejected") {
      toast("加载云贝中心失败，请确认登录状态", "error");
    }
  },

  sign: async () => {
    if (get().signing) return false;
    set({ signing: true });
    try {
      await dailySignIn(1);
      await yunbeiSign().catch(() => undefined);
      toast("签到成功", "success");
      await get().load();
      return true;
    } catch {
      toast("今天可能已经签到，或签到暂时失败", "error");
      return false;
    } finally {
      set({ signing: false });
    }
  },

  claim: async (task) => {
    const id = task.userTaskId ?? task.id;
    if (!id || get().claimingId) return false;
    set({ claimingId: id });
    try {
      await finishYunbeiTask(id, task.depositCode);
      set((state) => ({
        tasks: state.tasks.map((item) =>
          item.id === task.id ? { ...item, status: "claimed" } : item,
        ),
      }));
      toast("云贝已领取", "success");
      return true;
    } catch {
      toast("领取云贝失败", "error");
      return false;
    } finally {
      set({ claimingId: 0 });
    }
  },

  setLedgerType: async (type) => {
    set({ ledgerType: type, ledgerLoading: true });
    try {
      set({ ledger: await getYunbeiLedger(type), ledgerLoading: false });
    } catch {
      set({ ledger: [], ledgerLoading: false });
      toast("加载云贝记录失败", "error");
    }
  },
}));
