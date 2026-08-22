import { create } from "zustand";
import {
  getAnnualSummary,
  getListenRealtime,
  getListenTodaySongs,
  getListenTotal,
  getListenYearReport,
  getListenTimeMachine,
} from "../api/listenReports.ts";
import type {
  ListenReport,
  ListenTodaySong,
  ListenTotal,
  VipTimeMachineEntry,
} from "../api/types.ts";
interface State {
  total: ListenTotal | null;
  report: ListenReport | null;
  today: ListenTodaySong[];
  annual: unknown;
  timeMachine: VipTimeMachineEntry[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
}
export const useListenReportsStore = create<State>((set) => ({
  total: null,
  report: null,
  today: [],
  annual: null,
  timeMachine: [],
  loading: false,
  error: "",
  load: async () => {
    set({ loading: true, error: "" });
    const [total, report, today, annual, timeMachine] =
      await Promise.allSettled([
        getListenTotal(),
        getListenRealtime(),
        getListenTodaySongs(),
        getAnnualSummary(new Date().getFullYear()),
        getListenTimeMachine(),
      ]);
    void getListenYearReport().catch(() => undefined);
    set({
      total: total.status === "fulfilled" ? total.value : null,
      report: report.status === "fulfilled" ? report.value : null,
      today: today.status === "fulfilled" ? today.value : [],
      annual: annual.status === "fulfilled" ? annual.value : null,
      timeMachine: timeMachine.status === "fulfilled" ? timeMachine.value : [],
      loading: false,
      error:
        total.status === "rejected" && report.status === "rejected"
          ? "听歌报告暂时不可用"
          : "",
    });
  },
}));
