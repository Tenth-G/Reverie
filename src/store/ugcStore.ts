import { create } from "zustand";
import {
  getUgcAlbum,
  getUgcArtist,
  getUgcContributions,
  getUgcDevote,
  getUgcMv,
  getUgcSong,
  searchUgcArtists,
} from "../api/ugc.ts";
import type { UgcContribution, UgcDevote, UgcResource } from "../api/types.ts";
interface UgcState {
  resource: UgcResource | null;
  results: UgcResource[];
  contributions: UgcContribution[];
  devote: UgcDevote | null;
  loading: boolean;
  error: string;
  lookup: (kind: UgcResource["kind"], id: number) => Promise<void>;
  searchArtist: (keyword: string) => Promise<void>;
  load: () => Promise<void>;
}
export const useUgcStore = create<UgcState>((set) => ({
  resource: null,
  results: [],
  contributions: [],
  devote: null,
  loading: false,
  error: "",
  lookup: async (kind, id) => {
    set({ loading: true, error: "" });
    try {
      const resource =
        kind === "song"
          ? await getUgcSong(id)
          : kind === "album"
            ? await getUgcAlbum(id)
            : kind === "artist"
              ? await getUgcArtist(id)
              : await getUgcMv(id);
      set({ resource, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "加载百科贡献信息失败",
      });
    }
  },
  searchArtist: async (keyword) => {
    if (!keyword.trim()) return;
    set({ loading: true });
    try {
      set({ results: await searchUgcArtists(keyword), loading: false });
    } catch {
      set({ results: [], loading: false });
    }
  },
  load: async () => {
    set({ loading: true, error: "" });
    const [contributions, devote] = await Promise.allSettled([
      getUgcContributions(),
      getUgcDevote(),
    ]);
    set({
      contributions:
        contributions.status === "fulfilled" ? contributions.value : [],
      devote: devote.status === "fulfilled" ? devote.value : null,
      loading: false,
    });
  },
}));
