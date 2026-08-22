import { normalizeSong, request } from "./client.ts";
import type { DownloadHistoryCategory, Song } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export async function getDownloadHistory(
  category: DownloadHistoryCategory,
  limit = 30,
  offset = 0,
): Promise<Song[]> {
  const route =
    category === "all"
      ? "/song/downlist"
      : category === "month"
        ? "/song/monthdownlist"
        : "/song/purchased";
  const response = await request<Obj>(route, { limit, offset }, false);
  const data = obj(response.data ?? response);
  return arr(data.list ?? data.songs ?? response.songs ?? response.data)
    .map((raw) => normalizeSong(obj(raw).song ?? raw))
    .filter((song): song is Song => song !== null);
}
