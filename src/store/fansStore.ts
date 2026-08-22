import { create } from "zustand";
import {
  getCreatorAuthInfo,
  getFansDemographics,
  getFansOverview,
  getFansTrend,
  getInfluencerThreshold,
  type InfluencerThreshold,
} from "../api/fans.ts";
import type {
  CreatorAuthInfo,
  FansOverview,
  FansTrendPoint,
} from "../api/types.ts";
interface FansState {
  auth: CreatorAuthInfo | null;
  overview: FansOverview | null;
  trend: FansTrendPoint[];
  age: Array<{ label: string; value: number }>;
  gender: Array<{ label: string; value: number }>;
  province: Array<{ label: string; value: number }>;
  threshold: InfluencerThreshold | null;
  loading: boolean;
  error: string;
  load: () => Promise<void>;
}
export const useFansStore = create<FansState>((set) => ({
  auth: null,
  overview: null,
  trend: [],
  age: [],
  gender: [],
  province: [],
  threshold: null,
  loading: false,
  error: "",
  load: async () => {
    set({ loading: true, error: "" });
    const [auth, overview, trend, age, gender, province, threshold] =
      await Promise.allSettled([
        getCreatorAuthInfo(),
        getFansOverview(),
        getFansTrend(),
        getFansDemographics("age"),
        getFansDemographics("gender"),
        getFansDemographics("province"),
        getInfluencerThreshold(),
      ]);
    set({
      auth: auth.status === "fulfilled" ? auth.value : null,
      overview: overview.status === "fulfilled" ? overview.value : null,
      trend: trend.status === "fulfilled" ? trend.value : [],
      age: age.status === "fulfilled" ? age.value : [],
      gender: gender.status === "fulfilled" ? gender.value : [],
      province: province.status === "fulfilled" ? province.value : [],
      threshold: threshold.status === "fulfilled" ? threshold.value : null,
      loading: false,
      error: overview.status === "rejected" ? "粉丝中心暂时不可用" : "",
    });
  },
}));
