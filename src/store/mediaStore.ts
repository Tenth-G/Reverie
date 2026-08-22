import { create } from "zustand";
import { getMediaDetail, getMediaUrl, getRelatedMedia } from "../api/media.ts";
import type { MediaDetail, SearchMediaInfo } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface MediaState {
  item: SearchMediaInfo | null;
  detail: MediaDetail | null;
  url: string;
  related: SearchMediaInfo[];
  loading: boolean;
  urlLoading: boolean;
  error: string;
  resolution: 720 | 1080;
  open: (item: SearchMediaInfo) => Promise<void>;
  setResolution: (resolution: 720 | 1080) => Promise<void>;
  close: () => void;
}

let token = 0;

export const useMediaStore = create<MediaState>()((set, get) => ({
  item: null,
  detail: null,
  url: "",
  related: [],
  loading: false,
  urlLoading: false,
  error: "",
  resolution: 1080,

  open: async (item) => {
    const current = ++token;
    set({
      item,
      detail: null,
      url: "",
      related: [],
      loading: true,
      urlLoading: true,
      error: "",
    });
    const [detailResult, urlResult, relatedResult] = await Promise.allSettled([
      getMediaDetail(item),
      getMediaUrl(item, get().resolution),
      getRelatedMedia(item),
    ]);
    if (current !== token) return;
    const detail =
      detailResult.status === "fulfilled" ? detailResult.value : null;
    const url = urlResult.status === "fulfilled" ? urlResult.value : "";
    const related =
      relatedResult.status === "fulfilled" ? relatedResult.value : [];
    set({
      detail,
      url,
      related,
      loading: false,
      urlLoading: false,
      error: detail || url ? "" : "视频详情暂时不可用",
    });
    if (!detail && !url) {
      usePlayerStore.getState().toast("视频详情暂时不可用", "error");
    }
  },

  setResolution: async (resolution) => {
    const item = get().item;
    if (!item || get().resolution === resolution) return;
    const current = ++token;
    set({ resolution, urlLoading: true, url: "" });
    try {
      const url = await getMediaUrl(item, resolution);
      if (current === token) set({ url, urlLoading: false });
    } catch {
      if (current === token) {
        set({ urlLoading: false });
        usePlayerStore.getState().toast("切换清晰度失败", "error");
      }
    }
  },

  close: () => {
    token++;
    set({
      item: null,
      detail: null,
      url: "",
      related: [],
      loading: false,
      urlLoading: false,
      error: "",
    });
  },
}));
