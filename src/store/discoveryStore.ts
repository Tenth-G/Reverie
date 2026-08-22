import { create } from "zustand";
import {
  getPersonalizedMvs,
  getPersonalizedNewSongs,
  getPrivateContent,
  getPrivateContentList,
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
    const [newSongs, mvs, privateContent, privateContentList] = await Promise.allSettled([
      getPersonalizedNewSongs(),
      getPersonalizedMvs(),
      getPrivateContent(),
      getPrivateContentList(),
    ]);
    const privateItems = [
      ...(privateContent.status === "fulfilled" ? privateContent.value : []),
      ...(privateContentList.status === "fulfilled" ? privateContentList.value : []),
    ].filter((item, index, items) => items.findIndex((entry) => entry.id === item.id) === index);
    set({
      newSongs: newSongs.status === "fulfilled" ? newSongs.value : [],
      mvs: mvs.status === "fulfilled" ? mvs.value : [],
      privateContent: privateItems,
      loading: false,
    });
  },
}));
