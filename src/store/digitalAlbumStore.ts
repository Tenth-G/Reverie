import { create } from "zustand";
import {
  getDigitalAlbumDetail,
  getDigitalAlbumSales,
  getPurchasedDigitalAlbums,
  orderDigitalAlbum,
} from "../api/digitalAlbum.ts";
import type { DigitalAlbum } from "../api/types.ts";
import { usePlayerStore } from "./playerStore.ts";

interface DigitalAlbumState {
  detail: DigitalAlbum | null;
  purchased: DigitalAlbum[];
  loading: boolean;
  ordering: boolean;
  error: string;
  loadDetail: (id: number) => Promise<void>;
  loadPurchased: () => Promise<void>;
  order: (payment: "balance" | "alipay" | "wxpay") => Promise<void>;
}

export const useDigitalAlbumStore = create<DigitalAlbumState>((set, get) => ({
  detail: null,
  purchased: [],
  loading: false,
  ordering: false,
  error: "",
  loadDetail: async (id) => {
    set({ loading: true, error: "" });
    try {
      const detail = await getDigitalAlbumDetail(id);
      if (detail) {
        const sales = await getDigitalAlbumSales([id]).catch(
          () => ({}) as Record<number, number>,
        );
        if (sales[id] !== undefined) detail.sales = sales[id];
      }
      set({ detail, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "加载数字专辑失败",
      });
    }
  },
  loadPurchased: async () => {
    set({ loading: true, error: "" });
    try {
      set({ purchased: await getPurchasedDigitalAlbums(), loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "加载已购数字专辑失败",
      });
    }
  },
  order: async (payment) => {
    const detail = get().detail;
    if (!detail) return;
    set({ ordering: true, error: "" });
    try {
      await orderDigitalAlbum({ id: detail.id, payment });
      set({ ordering: false });
      usePlayerStore.getState().toast("数字专辑购买请求已提交", "success");
      await get().loadPurchased();
    } catch (error) {
      set({
        ordering: false,
        error: error instanceof Error ? error.message : "购买数字专辑失败",
      });
    }
  },
}));
