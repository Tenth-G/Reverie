import { request } from "./client.ts";
import type { LyricMark } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeMark(raw: unknown): LyricMark | null {
  const value = obj(raw);
  const song = obj(value.song);
  const id = String(value.id ?? value.markId ?? value.lyricMarkId ?? "");
  if (!id) return null;
  return {
    id,
    songId: Number(value.songId ?? song.id ?? 0),
    songName: String(value.songName ?? song.name ?? ""),
    originalLyricsText: String(
      value.originalLyricsText ?? value.original ?? value.text ?? "",
    ),
    translateLyricsText: String(
      value.translateLyricsText ?? value.translation ?? "",
    ),
    translateType: Number(value.translateType ?? 0),
    startTimeStamp: Number(
      value.startTimeStamp ?? value.startTime ?? value.time ?? 0,
    ),
    createdAt: Number(value.createTime ?? value.createdAt ?? value.time ?? 0),
  };
}

function marksFrom(response: Obj): LyricMark[] {
  const value = obj(response.data ?? response.result ?? response);
  return arr(
    value.list ?? value.records ?? value.marks ?? response.data ?? response,
  )
    .map(normalizeMark)
    .filter((item): item is LyricMark => item !== null);
}

export async function getSongLyricMarks(songId: number): Promise<LyricMark[]> {
  const response = await request<Obj>(
    "/song/lyrics/mark",
    { id: songId },
    false,
  );
  return marksFrom(response);
}

export async function addSongLyricMark(input: {
  songId: number;
  marks: Array<{
    startTimeStamp: number;
    originalLyricsText: string;
    translateLyricsText?: string;
    translateType?: number;
  }>;
  markId?: string;
}): Promise<void> {
  await request(
    "/song/lyrics/mark/add",
    {
      id: input.songId,
      markId: input.markId,
      data: JSON.stringify(input.marks),
    },
    false,
    { method: "POST" },
  );
}

export async function deleteSongLyricMarks(markIds: string[]): Promise<void> {
  if (!markIds.length) return;
  await request("/song/lyrics/mark/del", { id: markIds.join(",") }, false, {
    method: "POST",
  });
}

export async function getUserLyricMarks(
  limit = 20,
  offset = 0,
): Promise<LyricMark[]> {
  const response = await request<Obj>(
    "/song/lyrics/mark/user/page",
    { limit, offset },
    false,
  );
  return marksFrom(response);
}
