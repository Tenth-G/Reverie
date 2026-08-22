import { create } from "zustand";
import {
  getListeningRecords,
  getProfileCenter,
  type ListeningRecord,
  type ProfileDetail,
  type UserLevelInfo,
  type UserSubcount,
} from "../api/profile";
import { usePlayerStore } from "./playerStore";

type RecordPeriod = "week" | "all";

interface ProfileState {
  detail: ProfileDetail | null;
  level: UserLevelInfo | null;
  subcount: UserSubcount | null;
  records: ListeningRecord[];
  period: RecordPeriod;
  loading: boolean;
  recordsLoading: boolean;
  openProfile: () => Promise<void>;
  setPeriod: (period: RecordPeriod) => Promise<void>;
}

function showProfileView() {
  const player = usePlayerStore.getState();
  const previous = player.activeView;
  player.setPage("browse");
  player.setSearchOpen(false);
  usePlayerStore.setState({
    activeView: "profile",
    prevView: previous === "profile" ? player.prevView : previous,
  });
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  detail: null,
  level: null,
  subcount: null,
  records: [],
  period: "week",
  loading: false,
  recordsLoading: false,

  openProfile: async () => {
    const uid = usePlayerStore.getState().profile?.userId;
    if (!uid) {
      usePlayerStore.getState().setShowLogin(true);
      return;
    }
    showProfileView();
    set({ loading: true, period: "week" });
    try {
      const data = await getProfileCenter(uid);
      set({
        detail: data.detail,
        level: data.level,
        subcount: data.subcount,
        records: data.records,
      });
    } catch {
      usePlayerStore.getState().toast("加载个人中心失败", "error");
    } finally {
      set({ loading: false });
    }
  },

  setPeriod: async (period) => {
    if (period === get().period && get().records.length) return;
    const uid = usePlayerStore.getState().profile?.userId;
    if (!uid) return;
    set({ period, recordsLoading: true });
    try {
      set({ records: await getListeningRecords(uid, period) });
    } catch {
      usePlayerStore.getState().toast("加载听歌排行失败", "error");
    } finally {
      set({ recordsLoading: false });
    }
  },
}));
