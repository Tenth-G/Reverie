import { normalizeSong, request } from "./client.ts";
import type { PrivateDjItem } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Obj)
    : {};
const arr = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

function normalizeItem(raw: unknown, index: number): PrivateDjItem | null {
  const value = obj(raw);
  const resource = obj(value.resource ?? value.program ?? value.djProgram);
  const directSong = normalizeSong(value.song ?? value.mainSong);
  const resourceSong = normalizeSong(resource.song ?? resource.mainSong);
  const song = directSong ?? resourceSong;
  const explicitProgram = Boolean(value.program ?? value.programId ?? resource.programId);
  const kind: PrivateDjItem["kind"] = explicitProgram || (!song && Boolean(resource.id)) ? "program" : "song";
  const id = String(value.id ?? resource.id ?? `${kind}-${index}`);
  const title = String(value.title ?? value.name ?? resource.name ?? song?.name ?? "私人 DJ");
  if (!title) return null;
  return {
    id,
    kind,
    title,
    subtitle: String(
      value.reason ?? value.desc ?? value.description ?? resource.description ?? song?.artists ?? "",
    ),
    coverUrl: String(value.picUrl ?? value.coverUrl ?? resource.picUrl ?? resource.coverUrl ?? song?.picUrl ?? ""),
    programId: Number(value.programId ?? (kind === "program" ? resource.id ?? value.id : 0)),
    audioUrl: String(value.url ?? value.audioUrl ?? resource.url ?? ""),
    song,
  };
}

export async function getPrivateDjContent(
  latitude?: number,
  longitude?: number,
): Promise<PrivateDjItem[]> {
  const response = await request<Obj>(
    "/aidj/content/rcmd",
    { latitude, longitude },
    false,
  );
  const value = obj(response.data ?? response.result ?? response);
  return arr(value.list ?? value.data ?? value.items ?? response.data ?? response)
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is PrivateDjItem => item !== null);
}
