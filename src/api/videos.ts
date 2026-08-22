import { request } from "./client.ts";
import type { SearchMediaInfo } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeVideo(raw: unknown): SearchMediaInfo {
  const value = obj(raw);
  const creator = obj(value.creator);
  return {
    id: String(value.vid ?? value.id ?? ""),
    name: String(value.name ?? value.title ?? "未命名视频"),
    coverUrl: String(value.coverUrl ?? value.cover ?? value.imgurl ?? value.picUrl ?? ""),
    creatorName: String(value.creatorName ?? value.artistName ?? creator.nickname ?? ""),
    duration: Number(value.duration ?? value.durationms ?? 0),
    playCount: Number(value.playCount ?? value.playTime ?? 0),
    kind: "video",
  };
}

function extractVideos(response: Obj): SearchMediaInfo[] {
  const data = obj(response.data ?? response.result ?? response);
  return arr(data.datas ?? data.videos ?? data.list ?? response.data ?? response.result)
    .map(normalizeVideo)
    .filter((item) => item.id);
}

export interface VideoGroup { id: number; name: string; }

export async function getVideoTimeline(
  mode: "recommend" | "all" = "recommend",
  offset = 0,
): Promise<SearchMediaInfo[]> {
  const path = mode === "recommend" ? "/video/timeline/recommend" : "/video/timeline/all";
  return extractVideos(await request<Obj>(path, { offset }, false));
}

export async function getVideoGroups(): Promise<VideoGroup[]> {
  const response = await request<Obj>("/video/group/list", {}, false);
  const data = obj(response.data ?? response.result ?? response);
  return arr(data.data ?? data.list ?? response.data ?? response)
    .map((raw) => {
      const value = obj(raw);
      return { id: Number(value.id ?? value.groupId ?? 0), name: String(value.name ?? value.title ?? "") };
    })
    .filter((item) => item.id > 0 && item.name);
}

export async function getVideosByGroup(groupId: number, offset = 0): Promise<SearchMediaInfo[]> {
  if (!groupId) return [];
  return extractVideos(await request<Obj>("/video/group", { id: groupId, offset }, false));
}
