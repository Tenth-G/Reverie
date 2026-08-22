import { create } from "zustand";
import {
  getExclusiveMvs,
  getMvAll,
  getMvFirst,
  getMvToplist,
  getVideoGroups,
  getVideoTimeline,
  getVideosByGroup,
  type MvArea,
  type MvOrder,
  type MvType,
  type VideoGroup,
} from "../api/videos.ts";
import type { SearchMediaInfo } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

export type VideoMode = "recommend" | "all" | "group" | "mv-top" | "mv-first" | "mv-all" | "mv-exclusive";

interface VideoState {
  mode: VideoMode;
  groups: VideoGroup[];
  selectedGroup: number;
  videos: SearchMediaInfo[];
  loading: boolean;
  mvArea: MvArea;
  mvType: MvType;
  mvOrder: MvOrder;
  load: () => Promise<void>;
  setMode: (mode: VideoMode) => Promise<void>;
  selectGroup: (id: number) => Promise<void>;
  setMvFilters: (filters: Partial<Pick<VideoState, "mvArea" | "mvType" | "mvOrder">>) => Promise<void>;
}

async function loadMv(mode: VideoMode, area: MvArea, type: MvType, order: MvOrder): Promise<SearchMediaInfo[]> {
  if (mode === "mv-top") return getMvToplist(area);
  if (mode === "mv-first") return getMvFirst(area);
  if (mode === "mv-exclusive") return getExclusiveMvs();
  return getMvAll(area, type, order);
}

export const useVideoStore = create<VideoState>()((set) => ({
  mode: "recommend",
  groups: [],
  selectedGroup: 0,
  videos: [],
  loading: false,
  mvArea: "全部",
  mvType: "全部",
  mvOrder: "上升最快",
  load: async () => {
    set({ loading: true });
    const [groups, videos] = await Promise.allSettled([getVideoGroups(), getVideoTimeline("recommend")]);
    set({
      groups: groups.status === "fulfilled" ? groups.value : [],
      videos: videos.status === "fulfilled" ? videos.value : [],
      loading: false,
    });
  },
  setMode: async (mode) => {
    set({ mode, selectedGroup: 0, loading: true });
    try {
      const state = useVideoStore.getState();
      const videos = mode === "recommend" || mode === "all"
        ? await getVideoTimeline(mode)
        : await loadMv(mode, state.mvArea, state.mvType, state.mvOrder);
      set({ videos, loading: false });
    } catch {
      set({ videos: [], loading: false });
      usePlayerStore.getState().toast("加载视频列表失败", "error");
    }
  },
  selectGroup: async (id) => {
    set({ mode: "group", selectedGroup: id, loading: true });
    try {
      set({ videos: await getVideosByGroup(id), loading: false });
    } catch {
      set({ videos: [], loading: false });
      usePlayerStore.getState().toast("加载视频分组失败", "error");
    }
  },
  setMvFilters: async (filters) => {
    const next = { ...useVideoStore.getState(), ...filters };
    set({ ...filters, loading: true });
    try {
      const videos = await loadMv(next.mode, next.mvArea, next.mvType, next.mvOrder);
      set({ videos, loading: false });
    } catch {
      set({ videos: [], loading: false });
      usePlayerStore.getState().toast("加载 MV 列表失败", "error");
    }
  },
}));
