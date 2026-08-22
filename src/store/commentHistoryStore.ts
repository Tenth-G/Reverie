import { create } from "zustand";
import { getUserCommentHistory } from "../api/commentHistory.ts";
import type { UserCommentHistoryItem } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface CommentHistoryState {
  items: UserCommentHistoryItem[];
  loading: boolean;
  load: () => Promise<void>;
}

export const useCommentHistoryStore = create<CommentHistoryState>()((set) => ({
  items: [],
  loading: false,
  load: async () => {
    const uid = usePlayerStore.getState().profile?.userId ?? 0;
    if (!uid) return;
    set({ loading: true });
    try {
      set({ items: await getUserCommentHistory(uid), loading: false });
    } catch {
      set({ items: [], loading: false });
      usePlayerStore.getState().toast("加载评论历史失败", "error");
    }
  },
}));
