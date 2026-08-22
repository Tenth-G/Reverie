import { create } from "zustand";
import {
  getRecommendHistory,
  getRecommendHistoryDetail,
} from "../api/recommendHistory.ts";
import type { RecommendHistoryDay, Song } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface RecommendHistoryState {
  days: RecommendHistoryDay[];
  selectedDate: string;
  songs: Song[];
  loading: boolean;
  detailLoading: boolean;
  load: () => Promise<void>;
  selectDate: (date: string) => Promise<void>;
}

export const useRecommendHistoryStore = create<RecommendHistoryState>()(
  (set, get) => ({
    days: [],
    selectedDate: "",
    songs: [],
    loading: false,
    detailLoading: false,
    load: async () => {
      set({ loading: true });
      try {
        const days = await getRecommendHistory();
        set({ days, loading: false });
        if (days[0]?.date) await get().selectDate(days[0].date);
      } catch {
        set({ loading: false });
        usePlayerStore.getState().toast("加载推荐历史失败", "error");
      }
    },
    selectDate: async (date) => {
      set({ selectedDate: date, detailLoading: true });
      try {
        set({
          songs: await getRecommendHistoryDetail(date),
          detailLoading: false,
        });
      } catch {
        set({ songs: [], detailLoading: false });
        usePlayerStore.getState().toast("加载该日推荐失败", "error");
      }
    },
  }),
);
