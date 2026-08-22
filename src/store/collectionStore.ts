import { create } from "zustand";
import { getCollection, subscribeCollection } from "../api/collection";
import { getSearchMediaUrl } from "../api/search";
import type {
  AlbumInfo,
  ArtistInfo,
  CollectionCategory,
  CollectionResultPage,
  RadioInfo,
  SearchMediaInfo,
} from "../api/types";
import { useExploreStore } from "./exploreStore";
import { usePlayerStore } from "./playerStore";

const EMPTY: CollectionResultPage = {
  albums: [],
  artists: [],
  media: [],
  radios: [],
  total: 0,
  hasMore: false,
};
const PAGE_SIZE = 30;
let requestToken = 0;
let mediaToken = 0;

interface CollectionState extends CollectionResultPage {
  category: CollectionCategory;
  loading: boolean;
  loadingMore: boolean;
  mediaItem: SearchMediaInfo | null;
  mediaUrl: string;
  mediaLoading: boolean;
  openCollections: (category?: CollectionCategory) => Promise<void>;
  setCategory: (category: CollectionCategory) => Promise<void>;
  loadMore: () => Promise<void>;
  unsubscribe: (id: number) => Promise<void>;
  openAlbum: (album: AlbumInfo) => Promise<void>;
  openArtist: (artist: ArtistInfo) => Promise<void>;
  openRadio: (radio: RadioInfo) => Promise<void>;
  playMedia: (item: SearchMediaInfo) => Promise<void>;
  closeMedia: () => void;
}

function showView() {
  const player = usePlayerStore.getState();
  const previous = player.activeView;
  player.setPage("browse");
  player.setSearchOpen(false);
  usePlayerStore.setState({
    activeView: "collection",
    prevView: previous === "collection" ? player.prevView : previous,
  });
}

export const useCollectionStore = create<CollectionState>()((set, get) => ({
  ...EMPTY,
  category: "albums",
  loading: false,
  loadingMore: false,
  mediaItem: null,
  mediaUrl: "",
  mediaLoading: false,

  openCollections: async (category = get().category) => {
    const token = ++requestToken;
    showView();
    set({
      ...EMPTY,
      category,
      loading: true,
      loadingMore: false,
      mediaItem: null,
      mediaUrl: "",
      mediaLoading: false,
    });
    try {
      const result = await getCollection(category, PAGE_SIZE, 0);
      if (token !== requestToken || get().category !== category) return;
      set({ ...result, loading: false });
    } catch {
      if (token !== requestToken || get().category !== category) return;
      set({ ...EMPTY, category, loading: false });
      usePlayerStore.getState().toast("加载收藏中心失败", "error");
    }
  },

  setCategory: async (category) => {
    if (category === get().category && !get().loading) return;
    await get().openCollections(category);
  },

  loadMore: async () => {
    const state = get();
    if (state.loading || state.loadingMore || !state.hasMore) return;
    const token = requestToken;
    const category = state.category;
    set({ loadingMore: true });
    try {
      const next = await getCollection(
        category,
        PAGE_SIZE,
        state.albums.length +
          state.artists.length +
          state.media.length +
          state.radios.length,
      );
      if (token !== requestToken || get().category !== category) return;
      set((current) => ({
        albums: [...current.albums, ...next.albums],
        artists: [...current.artists, ...next.artists],
        media: [...current.media, ...next.media],
        radios: [...current.radios, ...next.radios],
        total: next.total,
        hasMore: next.hasMore,
        loadingMore: false,
      }));
    } catch {
      if (token !== requestToken || get().category !== category) return;
      set({ loadingMore: false });
      usePlayerStore.getState().toast("加载更多收藏失败", "error");
    }
  },

  unsubscribe: async (id) => {
    const category = get().category;
    try {
      await subscribeCollection(category, id, false);
      set((state) =>
        state.category !== category
          ? {}
          : {
              albums:
                category === "albums"
                  ? state.albums.filter((item) => item.id !== id)
                  : state.albums,
              artists:
                category === "artists"
                  ? state.artists.filter((item) => item.id !== id)
                  : state.artists,
              media:
                category === "mvs"
                  ? state.media.filter((item) => Number(item.id) !== id)
                  : state.media,
              radios:
                category === "radios"
                  ? state.radios.filter((item) => item.id !== id)
                  : state.radios,
              total: Math.max(0, state.total - 1),
            },
      );
      usePlayerStore.getState().toast("已取消收藏", "success");
    } catch {
      usePlayerStore.getState().toast("取消收藏失败", "error");
    }
  },

  openAlbum: async (album) => {
    await useExploreStore.getState().openAlbum(album.id);
  },
  openArtist: async (artist) => {
    await useExploreStore.getState().openArtist(artist.id);
  },
  openRadio: async (radio) => {
    await useExploreStore.getState().openRadio(radio.id);
  },
  playMedia: async (item) => {
    const token = ++mediaToken;
    set({ mediaItem: item, mediaUrl: "", mediaLoading: true });
    try {
      const mediaUrl = await getSearchMediaUrl(item);
      if (token !== mediaToken) return;
      if (!mediaUrl) throw new Error("missing media url");
      set({ mediaUrl, mediaLoading: false });
    } catch {
      if (token !== mediaToken) return;
      set({ mediaItem: null, mediaUrl: "", mediaLoading: false });
      usePlayerStore.getState().toast("MV 暂时无法播放", "error");
    }
  },
  closeMedia: () => {
    mediaToken++;
    set({ mediaItem: null, mediaUrl: "", mediaLoading: false });
  },
}));
