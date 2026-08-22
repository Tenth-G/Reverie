import { create } from "zustand";
import { getChartSongs, getChartSummaries, getChartSummariesV2 } from "../api/charts.ts";
import type { ChartSummary, Song } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface ChartState {
  charts: ChartSummary[];
  selectedId: number;
  songs: Song[];
  loading: boolean;
  songsLoading: boolean;
  load: () => Promise<void>;
  select: (id: number) => Promise<void>;
}

let requestToken = 0;

export const useChartStore = create<ChartState>()((set, get) => ({
  charts: [],
  selectedId: 0,
  songs: [],
  loading: false,
  songsLoading: false,

  load: async () => {
    const token = ++requestToken;
    set({ loading: true });
    try {
      const [v2, legacy] = await Promise.allSettled([
        getChartSummariesV2(),
        getChartSummaries(),
      ]);
      const rows = [
        ...(v2.status === "fulfilled" ? v2.value : []),
        ...(legacy.status === "fulfilled" ? legacy.value : []),
      ];
      const seen = new Set<number>();
      const charts = rows.filter((chart) => {
        if (seen.has(chart.id)) return false;
        seen.add(chart.id);
        return true;
      });
      if (!charts.length) throw new Error("榜单目录为空");
      if (token !== requestToken) return;
      const selectedId = get().selectedId || charts[0]?.id || 0;
      set({ charts, selectedId, loading: false });
      if (selectedId) await get().select(selectedId);
    } catch {
      if (token !== requestToken) return;
      set({ charts: [], songs: [], selectedId: 0, loading: false });
      usePlayerStore.getState().toast("加载榜单目录失败", "error");
    }
  },

  select: async (id) => {
    if (!id) return;
    const token = ++requestToken;
    set({ selectedId: id, songsLoading: true });
    try {
      const songs = await getChartSongs(id);
      if (token !== requestToken) return;
      set({ songs, songsLoading: false });
    } catch {
      if (token !== requestToken) return;
      set({ songs: [], songsLoading: false });
      usePlayerStore.getState().toast("加载榜单歌曲失败", "error");
    }
  },
}));
