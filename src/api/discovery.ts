import { normalizeSong, request } from "./client.ts";
import type { SearchMediaInfo, Song } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export async function getPersonalizedNewSongs(limit = 12): Promise<Song[]> {
  const response = await request<Obj>(
    "/personalized/newsong",
    { limit },
    false,
  );
  return arr(response.result ?? response.data)
    .map((raw) => normalizeSong(obj(raw).song ?? raw))
    .filter((song): song is Song => song !== null);
}

function mediaList(response: Obj, kind: "mv" | "video"): SearchMediaInfo[] {
  return arr(response.result ?? response.data)
    .map((raw) => {
      const value = obj(raw);
      return {
        id: String(value.id ?? value.vid ?? ""),
        name: String(value.name ?? value.title ?? "未命名内容"),
        coverUrl: String(
          value.picUrl ?? value.cover ?? value.coverUrl ?? value.imgurl ?? "",
        ),
        creatorName: String(
          value.artistName ?? obj(value.creator).nickname ?? "",
        ),
        duration: Number(value.duration ?? value.durationms ?? 0),
        playCount: Number(value.playCount ?? 0),
        kind,
      } satisfies SearchMediaInfo;
    })
    .filter((item) => item.id);
}

export async function getPersonalizedMvs(): Promise<SearchMediaInfo[]> {
  return mediaList(await request<Obj>("/personalized/mv", {}, false), "mv");
}

export async function getPrivateContent(): Promise<SearchMediaInfo[]> {
  return mediaList(
    await request<Obj>("/personalized/privatecontent", {}, false),
    "video",
  );
}

export async function getPrivateContentList(limit = 12, offset = 0): Promise<SearchMediaInfo[]> {
  return mediaList(
    await request<Obj>("/personalized/privatecontent/list", { limit, offset }, false),
    "video",
  );
}
