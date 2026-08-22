import { create } from "zustand";
import {
  getPersonalizedMvs,
  getPersonalizedNewSongs,
  getPrivateContent,
} from "../api/discovery.ts";
import type { SearchMediaInfo, Song } from "../api/types.ts";

interface DiscoveryState {
  newSongs: Song[];
  mvs: SearchMediaInfo[];
  privateContent: SearchMediaInfo[];
  loading: boolean;
  load: () => Promise<void>;
}

export const useDiscoveryStore = create<DiscoveryState>()((set) => ({
  newSongs: [],
  mvs: [],
  privateContent: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const [newSongs, mvs, privateContent] = await Promise.allSettled([
      getPersonalizedNewSongs(),
      getPersonalizedMvs(),
      getPrivateContent(),
    ]);
    set({
      newSongs: newSongs.status === "fulfilled" ? newSongs.value : [],
      mvs: mvs.status === "fulfilled" ? mvs.value : [],
      privateContent:
        privateContent.status === "fulfilled" ? privateContent.value : [],
      loading: false,
    });
  },
}));
