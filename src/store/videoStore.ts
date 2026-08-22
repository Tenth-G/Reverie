import { create } from "zustand";
import { getVideoGroups, getVideoTimeline, getVideosByGroup, type VideoGroup } from "../api/videos.ts";
import type { SearchMediaInfo } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface VideoState {
  mode: "recommend" | "all" | "group";
  groups: VideoGroup[];
  selectedGroup: number;
  videos: SearchMediaInfo[];
  loading: boolean;
  load: () => Promise<void>;
  setMode: (mode: "recommend" | "all") => Promise<void>;
  selectGroup: (id: number) => Promise<void>;
}

export const useVideoStore = create<VideoState>()((set) => ({
  mode: "recommend",
  groups: [],
  selectedGroup: 0,
  videos: [],
  loading: false,
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
      set({ videos: await getVideoTimeline(mode), loading: false });
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
}));
