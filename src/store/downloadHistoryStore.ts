import { create } from "zustand";
import { getDownloadHistory } from "../api/downloadHistory.ts";
import type { DownloadHistoryCategory, Song } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface DownloadHistoryState {
  category: DownloadHistoryCategory;
  songs: Song[];
  loading: boolean;
  setCategory: (category: DownloadHistoryCategory) => Promise<void>;
  load: (category?: DownloadHistoryCategory) => Promise<void>;
}

export const useDownloadHistoryStore = create<DownloadHistoryState>()(
  (set, get) => ({
    category: "all",
    songs: [],
    loading: false,
    setCategory: async (category) => {
      set({ category });
      await get().load(category);
    },
    load: async (category = get().category) => {
      set({ loading: true });
      try {
        set({ songs: await getDownloadHistory(category), loading: false });
      } catch {
        set({ songs: [], loading: false });
        usePlayerStore.getState().toast("加载下载记录失败", "error");
      }
    },
  }),
);
