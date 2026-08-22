import { create } from "zustand";
import {
  deleteVoices,
  getVoiceDetail,
  getVoiceListDetail,
  getVoicesByList,
  getVoiceLyric,
  searchVoiceLists,
  searchVoices,
  transcribeVoice,
  uploadVoice,
} from "../api/voice.ts";
import type { VoiceItem, VoiceListInfo } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface VoiceState {
  lists: VoiceListInfo[];
  selectedList: VoiceListInfo | null;
  voices: VoiceItem[];
  search: string;
  loading: boolean;
  uploading: boolean;
  busyId: number;
  activeVoice: VoiceItem | null;
  activeLyric: string;
  detailLoading: boolean;
  error: string;
  loadLists: (query?: string) => Promise<void>;
  selectList: (list: VoiceListInfo) => Promise<void>;
  searchCurrentList: (query?: string) => Promise<void>;
  upload: (file: File, name?: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
  transcribe: (voice: VoiceItem) => Promise<void>;
  loadLyric: (voice: VoiceItem) => Promise<string>;
  openDetail: (voice: VoiceItem) => Promise<void>;
  closeDetail: () => void;
  setSearch: (value: string) => void;
  clearError: () => void;
}

let loadToken = 0;

export const useVoiceStore = create<VoiceState>((set, get) => ({
  lists: [],
  selectedList: null,
  voices: [],
  search: "",
  loading: false,
  uploading: false,
  busyId: 0,
  activeVoice: null,
  activeLyric: "",
  detailLoading: false,
  error: "",

  setSearch: (value) => set({ search: value }),
  clearError: () => set({ error: "" }),

  loadLists: async (query = "") => {
    const token = ++loadToken;
    set({ loading: true, error: "", search: query });
    try {
      const lists = await searchVoiceLists({ podcastName: query });
      if (token !== loadToken) return;
      set({ lists, loading: false });
      const selected = get().selectedList;
      if (selected) {
        const refreshed = lists.find((item) => item.id === selected.id);
        if (refreshed) await get().selectList(refreshed);
      }
    } catch (error) {
      if (token !== loadToken) return;
      set({
        loading: false,
        error: error instanceof Error ? error.message : "加载声音列表失败",
      });
    }
  },

  selectList: async (list) => {
    const token = ++loadToken;
    set({ selectedList: list, voices: [], loading: true, error: "" });
    try {
      const [detail, voices] = await Promise.all([
        getVoiceListDetail(list.id).catch(() => null),
        getVoicesByList(list.id),
      ]);
      if (token !== loadToken) return;
      set({ selectedList: detail ?? list, voices, loading: false });
    } catch (error) {
      if (token === loadToken) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : "加载声音失败",
        });
      }
    }
  },

  searchCurrentList: async (query = get().search) => {
    const token = ++loadToken;
    set({ loading: true, error: "", search: query });
    try {
      const voices = await searchVoices({
        name: query,
        voiceListId: get().selectedList?.id,
      });
      if (token === loadToken) set({ voices, loading: false });
    } catch (error) {
      if (token === loadToken) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : "搜索声音失败",
        });
      }
    }
  },

  upload: async (file, name) => {
    const listId = get().selectedList?.id;
    set({ uploading: true, error: "" });
    try {
      await uploadVoice(file, {
        songName: name?.trim() || undefined,
        voiceListId: listId,
      });
      set({ uploading: false });
      usePlayerStore.getState().toast("声音上传已提交", "success");
      if (get().selectedList) await get().selectList(get().selectedList!);
    } catch (error) {
      set({
        uploading: false,
        error: error instanceof Error ? error.message : "上传声音失败",
      });
    }
  },

  remove: async (id) => {
    set({ busyId: id, error: "" });
    try {
      await deleteVoices([id]);
      set({
        voices: get().voices.filter((voice) => voice.id !== id),
        busyId: 0,
      });
      usePlayerStore.getState().toast("声音已删除", "success");
    } catch (error) {
      set({
        busyId: 0,
        error: error instanceof Error ? error.message : "删除声音失败",
      });
    }
  },

  transcribe: async (voice) => {
    const radioId = voice.voiceListId;
    if (!radioId) {
      set({ error: "该声音缺少电台信息，无法提交转写" });
      return;
    }
    set({ busyId: voice.id, error: "" });
    try {
      await transcribeVoice({ radioId, programId: voice.id });
      set({
        busyId: 0,
        voices: get().voices.map((item) =>
          item.id === voice.id ? { ...item, transcribed: true } : item,
        ),
      });
      usePlayerStore.getState().toast("已提交歌词转写", "success");
    } catch (error) {
      set({
        busyId: 0,
        error: error instanceof Error ? error.message : "提交转写失败",
      });
    }
  },

  loadLyric: async (voice) => {
    try {
      return await getVoiceLyric(voice.id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "加载声音歌词失败",
      });
      return "";
    }
  },

  openDetail: async (voice) => {
    const token = ++loadToken;
    set({ activeVoice: voice, activeLyric: "", detailLoading: true });
    const [detail, lyric] = await Promise.allSettled([
      getVoiceDetail(voice.id),
      getVoiceLyric(voice.id),
    ]);
    if (token !== loadToken) return;
    set({
      activeVoice:
        detail.status === "fulfilled" && detail.value ? detail.value : voice,
      activeLyric: lyric.status === "fulfilled" ? lyric.value : "",
      detailLoading: false,
    });
  },

  closeDetail: () =>
    set({ activeVoice: null, activeLyric: "", detailLoading: false }),
}));
