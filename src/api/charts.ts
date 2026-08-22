import { normalizeSong, request } from "./client.ts";
import type { ChartSummary, Song } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeChart(raw: unknown): ChartSummary | null {
  const value = obj(raw);
  const id = Number(value.id ?? value.chartId ?? 0);
  if (!id) return null;
  return {
    id,
    name: String(value.name ?? value.title ?? "音乐榜单"),
    coverUrl: String(value.coverImgUrl ?? value.cover ?? value.picUrl ?? ""),
    updateFrequency: String(
      value.updateFrequency ?? value.updateFrequencyText ?? value.frequency ?? "",
    ),
    description: String(value.description ?? value.desc ?? ""),
    trackCount: Number(value.trackCount ?? value.songCount ?? 0),
  };
}

export async function getChartSummaries(): Promise<ChartSummary[]> {
  const response = await request<Obj>("/toplist/detail", {}, false);
  return arr(response.list ?? response.data ?? response.result)
    .map(normalizeChart)
    .filter((item): item is ChartSummary => item !== null);
}

export async function getChartSongs(id: number): Promise<Song[]> {
  if (!id) return [];
  const response = await request<Obj>("/top/list", { id }, false);
  const playlist = obj(response.playlist ?? response.data);
  const rows = arr(playlist.tracks ?? response.tracks ?? response.data);
  return rows
    .map((raw) => normalizeSong(obj(raw).song ?? raw))
    .filter((song): song is Song => song !== null);
}
