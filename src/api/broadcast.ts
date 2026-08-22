import { request } from "./client.ts";
import type { BroadcastChannel, BroadcastCategory, Song } from "./types.ts";
import { normalizeSong } from "./client.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeChannel(raw: unknown): BroadcastChannel | null {
  const value = obj(raw);
  const id = Number(value.id ?? value.channelId ?? 0);
  if (!id) return null;
  return {
    id,
    name: String(value.name ?? value.channelName ?? "广播电台"),
    description: String(value.description ?? value.desc ?? ""),
    coverUrl: String(value.picUrl ?? value.coverUrl ?? value.coverImgUrl ?? ""),
    subscribed: Boolean(value.subscribed ?? value.collected ?? false),
    categoryName: String(value.categoryName ?? value.category ?? ""),
    regionName: String(value.regionName ?? value.region ?? ""),
    currentSong: normalizeSong(value.song ?? value.currentSong) ?? undefined,
  };
}
export async function getBroadcastCategories(): Promise<BroadcastCategory[]> {
  const response = await request<Obj>(
    "/broadcast/category/region/get",
    {},
    false,
  );
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.category ?? value.categories ?? value.list)
    .map((item) => {
      const row = obj(item);
      return {
        id: Number(row.id ?? row.categoryId ?? 0),
        name: String(row.name ?? row.categoryName ?? ""),
      };
    })
    .filter((item) => item.id > 0 && item.name);
}
export async function getBroadcastChannels(
  input: {
    categoryId?: number;
    regionId?: number;
    limit?: number;
    lastId?: number;
  } = {},
): Promise<BroadcastChannel[]> {
  const response = await request<Obj>("/broadcast/channel/list", {
    categoryId: input.categoryId,
    regionId: input.regionId,
    limit: input.limit ?? 20,
    lastId: input.lastId ?? 0,
  });
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.channels ?? response.data ?? response)
    .map(normalizeChannel)
    .filter((item): item is BroadcastChannel => item !== null);
}
export async function getBroadcastCurrentInfo(
  id: number,
): Promise<BroadcastChannel | null> {
  const response = await request<Obj>(
    "/broadcast/channel/currentinfo",
    { id },
    false,
  );
  return normalizeChannel(response.data ?? response.result ?? response);
}
export async function getBroadcastCollected(): Promise<BroadcastChannel[]> {
  const response = await request<Obj>(
    "/broadcast/channel/collect/list",
    {},
    false,
  );
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.channels ?? response.data ?? response)
    .map(normalizeChannel)
    .filter((item): item is BroadcastChannel => item !== null);
}
export async function toggleBroadcastSubscription(
  id: number,
  subscribed: boolean,
): Promise<void> {
  await request("/broadcast/sub", { id, t: subscribed ? 1 : 0 }, false, {
    method: "POST",
  });
}
export async function getSportRadio(bpm = 50): Promise<Song[]> {
  const response = await request<Obj>("/radio/sport/get", { bpm });
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.data ?? value.list ?? response.data ?? response)
    .map(normalizeSong)
    .filter((item): item is Song => item !== null);
}
