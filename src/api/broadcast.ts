import { request } from "./client.ts";
import type {
  BroadcastChannel,
  BroadcastCategory,
  PodcastProgramDetail,
  RadioInfo,
  Song,
} from "./types.ts";
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

export async function getPodcastToplist(
  type: "new" | "hot" = "new",
  limit = 30,
  offset = 0,
): Promise<RadioInfo[]> {
  const response = await request<Obj>("/dj/toplist", {
    type,
    limit,
    offset,
  });
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.djRadios ?? response.data ?? response)
    .map((raw) => {
      const item = obj(raw);
      const dj = obj(item.dj);
      return {
        id: Number(item.id ?? item.rid ?? 0),
        name: String(item.name ?? item.radioName ?? "播客电台"),
        picUrl: String(item.picUrl ?? item.intervenePicUrl ?? item.coverUrl ?? ""),
        description: String(item.desc ?? item.description ?? ""),
        programCount: Number(item.programCount ?? 0),
        subscriberCount: Number(item.subCount ?? item.subscriberCount ?? 0),
        subscribed: Boolean(item.subscribed ?? false),
        category: String(item.category ?? item.categoryName ?? ""),
        djName: String(dj.nickname ?? item.djName ?? ""),
      } satisfies RadioInfo;
    })
    .filter((item) => item.id > 0);
}

function normalizeRadioList(response: Obj): RadioInfo[] {
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.djRadios ?? response.data ?? response)
    .map((raw) => {
      const item = obj(raw);
      const dj = obj(item.dj);
      return {
        id: Number(item.id ?? item.rid ?? 0),
        name: String(item.name ?? item.radioName ?? "播客电台"),
        picUrl: String(item.picUrl ?? item.intervenePicUrl ?? item.coverUrl ?? ""),
        description: String(item.desc ?? item.description ?? ""),
        programCount: Number(item.programCount ?? 0),
        subscriberCount: Number(item.subCount ?? item.subscriberCount ?? 0),
        subscribed: Boolean(item.subscribed ?? false),
        category: String(item.category ?? item.categoryName ?? ""),
        djName: String(dj.nickname ?? item.djName ?? ""),
      } satisfies RadioInfo;
    })
    .filter((item) => item.id > 0);
}

export async function getPodcastCategories(): Promise<BroadcastCategory[]> {
  const response = await request<Obj>("/dj/catelist", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.categories ?? value.list ?? response.categories ?? response.data)
    .map((raw) => {
      const item = obj(raw);
      return { id: Number(item.id ?? item.categoryId ?? 0), name: String(item.name ?? item.categoryName ?? "") };
    })
    .filter((item) => item.id > 0 && item.name);
}

export async function getPodcastCategoryRecommendations(categoryId: number): Promise<RadioInfo[]> {
  const response = await request<Obj>("/dj/recommend/type", { type: categoryId }, false);
  return normalizeRadioList(response);
}

export async function getPodcastHotRadios(categoryId?: number, limit = 30, offset = 0): Promise<RadioInfo[]> {
  const response = await request<Obj>("/dj/radio/hot", { cateId: categoryId, limit, offset }, false);
  return normalizeRadioList(response);
}

export async function getPodcastBanners(): Promise<Array<{ imageUrl: string; title: string; url: string }>> {
  const response = await request<Obj>("/dj/banner", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.banners ?? value.list ?? response.data ?? response).map((raw) => {
    const item = obj(raw);
    return {
      imageUrl: String(item.pic ?? item.picUrl ?? item.imageUrl ?? ""),
      title: String(item.typeTitle ?? item.title ?? "播客"),
      url: String(item.url ?? item.targetUrl ?? ""),
    };
  }).filter((item) => item.imageUrl);
}

export async function getPodcastProgramDetail(
  id: number,
): Promise<PodcastProgramDetail> {
  const response = await request<Obj>("/dj/program/detail", { id }, false);
  const value = obj(response.program ?? response.data ?? response);
  const radio = obj(value.radio);
  const dj = obj(value.dj);
  return {
    id: Number(value.id ?? id),
    name: String(value.name ?? value.programName ?? "播客节目"),
    description: String(value.description ?? value.desc ?? value.reason ?? ""),
    coverUrl: String(value.coverUrl ?? value.picUrl ?? value.cover ?? ""),
    radioName: String(value.radioName ?? radio.name ?? ""),
    djName: String(value.djName ?? dj.nickname ?? ""),
    publishTime: Number(value.createTime ?? value.publishTime ?? value.pubTime ?? 0),
    duration: Number(value.duration ?? value.durationms ?? 0),
    commentCount: Number(value.commentCount ?? value.commentCountAll ?? 0),
    song: normalizeSong(value.mainSong ?? value.song),
  };
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
