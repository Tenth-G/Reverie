import { normalizeSong, request } from "./client.ts";
import type { RecommendHistoryDay, Song } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export async function getRecommendHistory(): Promise<RecommendHistoryDay[]> {
  const response = await request<Obj>("/history/recommend/songs", {}, false);
  return arr(response.data ?? response.list ?? response)
    .map((raw) => {
      const value = obj(raw);
      const date = String(value.date ?? value.day ?? value.recommendDate ?? "");
      return {
        date,
        displayDate: String(value.displayDate ?? value.date ?? date),
        songCount: Number(value.songCount ?? value.count ?? 0),
      } satisfies RecommendHistoryDay;
    })
    .filter((item) => item.date);
}

export async function getRecommendHistoryDetail(date: string): Promise<Song[]> {
  const response = await request<Obj>(
    "/history/recommend/songs/detail",
    { date },
    false,
  );
  const data = obj(response.data ?? response);
  return arr(data.dailySongs ?? data.songs ?? response.songs)
    .map((raw) => normalizeSong(obj(raw).song ?? raw))
    .filter((song): song is Song => song !== null);
}
