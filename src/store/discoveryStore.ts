import { create } from "zustand";
import {
  getPersonalizedMvs,
  getPersonalizedNewSongs,
  getPrivateContent,
  getPrivateContentList,
  getRecommendResources,
} from "../api/discovery.ts";
import type { PlaylistInfo, SearchMediaInfo, Song } from "../api/types.ts";

interface DiscoveryState {
  newSongs: Song[];
  mvs: SearchMediaInfo[];
  privateContent: SearchMediaInfo[];
  recommendResources: PlaylistInfo[];
  loading: boolean;
  load: () => Promise<void>;
}

export const useDiscoveryStore = create<DiscoveryState>()((set) => ({
  newSongs: [],
  mvs: [],
  privateContent: [],
  recommendResources: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const [newSongs, mvs, privateContent, privateContentList, recommendResources] = await Promise.allSettled([
      getPersonalizedNewSongs(),
      getPersonalizedMvs(),
      getPrivateContent(),
      getPrivateContentList(),
      getRecommendResources(),
    ]);
    const privateItems = [
      ...(privateContent.status === "fulfilled" ? privateContent.value : []),
      ...(privateContentList.status === "fulfilled" ? privateContentList.value : []),
    ].filter((item, index, items) => items.findIndex((entry) => entry.id === item.id) === index);
    set({
      newSongs: newSongs.status === "fulfilled" ? newSongs.value : [],
      mvs: mvs.status === "fulfilled" ? mvs.value : [],
      privateContent: privateItems,
      recommendResources: recommendResources.status === "fulfilled" ? recommendResources.value : [],
      loading: false,
    });
  },
}));
