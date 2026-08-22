import { create } from "zustand";
import { getSongMetadata } from "../api/songMetadata.ts";
import type { SongMetadata } from "../api/types.ts";

interface SongMetadataState {
  songId: number;
  metadata: SongMetadata | null;
  loading: boolean;
  load: (songId: number) => Promise<void>;
}

let token = 0;

export const useSongMetadataStore = create<SongMetadataState>()((set) => ({
  songId: 0,
  metadata: null,
  loading: false,
  load: async (songId) => {
    const current = ++token;
    set({ songId, metadata: null, loading: true });
    try {
      const metadata = await getSongMetadata(songId);
      if (current === token) set({ metadata, loading: false });
    } catch {
      if (current === token) set({ metadata: null, loading: false });
    }
  },
}));
