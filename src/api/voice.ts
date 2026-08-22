import { normalizeSong, request } from "./client.ts";
import type { VoiceItem, VoiceListInfo } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function unwrap(value: Obj): unknown {
  return value.data ?? value.result ?? value.list ?? value.voices ?? value;
}

export function normalizeVoice(raw: unknown): VoiceItem | null {
  const value = obj(raw);
  const nested = obj(value.program ?? value.voice ?? value.simpleProgram);
  const id = Number(
    value.id ?? value.programId ?? value.voiceId ?? nested.id ?? 0,
  );
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const song = normalizeSong(value.song ?? nested.song);
  return {
    id,
    name: String(
      value.name ??
        value.programName ??
        nested.name ??
        song?.name ??
        "未命名声音",
    ),
    description: String(
      value.description ?? value.desc ?? nested.description ?? "",
    ),
    coverUrl: String(
      value.coverUrl ??
        value.coverImgUrl ??
        value.picUrl ??
        nested.coverUrl ??
        nested.picUrl ??
        song?.picUrl ??
        "",
    ),
    duration: Number(
      value.duration ??
        value.durationMs ??
        value.dt ??
        nested.duration ??
        song?.duration ??
        0,
    ),
    playCount: Number(
      value.listenerCount ?? value.playCount ?? value.listenerNum ?? 0,
    ),
    voiceListId:
      Number(
        value.voiceListId ??
          value.radioId ??
          value.djRadioId ??
          nested.radioId ??
          0,
      ) || undefined,
    voiceListName: String(
      value.voiceListName ?? value.radioName ?? nested.radioName ?? "",
    ),
    status: String(value.status ?? value.displayStatus ?? ""),
    transcribed: Boolean(
      value.transcribed ?? value.transStatus ?? value.hasLyric ?? false,
    ),
    createdAt: Number(value.createTime ?? value.createdAt ?? 0),
  };
}

function normalizeVoiceList(raw: unknown): VoiceListInfo | null {
  const value = obj(raw);
  const id = Number(value.id ?? value.radioId ?? value.voiceListId ?? 0);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return {
    id,
    name: String(
      value.name ?? value.radioName ?? value.podcastName ?? "未命名电台",
    ),
    coverUrl: String(value.picUrl ?? value.coverUrl ?? value.coverImgUrl ?? ""),
    description: String(value.description ?? value.desc ?? ""),
    voiceCount: Number(
      value.programCount ?? value.voiceCount ?? value.trackCount ?? 0,
    ),
    subscribed: Boolean(value.subscribed ?? value.sub ?? false),
  };
}

export async function searchVoiceLists(
  input: {
    podcastName?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<VoiceListInfo[]> {
  const response = await request<Obj>("/voicelist/search", {
    podcastName: input.podcastName ?? "",
    limit: input.limit ?? 50,
    offset: input.offset ?? 0,
  });
  return arr(unwrap(response))
    .map(normalizeVoiceList)
    .filter((item): item is VoiceListInfo => item !== null);
}

export async function getVoiceListDetail(
  id: number,
): Promise<VoiceListInfo | null> {
  const response = await request<Obj>("/voicelist/detail", { id });
  return normalizeVoiceList(response.data ?? response.result ?? response);
}

export async function getVoicesByList(
  voiceListId: number,
  limit = 50,
  offset = 0,
): Promise<VoiceItem[]> {
  const response = await request<Obj>("/voicelist/list", {
    voiceListId,
    limit,
    offset,
  });
  return arr(unwrap(response))
    .map(normalizeVoice)
    .filter((item): item is VoiceItem => item !== null);
}

export async function searchVoices(
  input: {
    name?: string;
    voiceListId?: number;
    limit?: number;
    offset?: number;
  } = {},
): Promise<VoiceItem[]> {
  const response = await request<Obj>("/voicelist/list/search", {
    name: input.name ?? "",
    voiceListId: input.voiceListId,
    limit: input.limit ?? 50,
    offset: input.offset ?? 0,
  });
  return arr(unwrap(response))
    .map(normalizeVoice)
    .filter((item): item is VoiceItem => item !== null);
}

export async function getVoiceDetail(id: number): Promise<VoiceItem | null> {
  const response = await request<Obj>("/voice/detail", { id });
  return normalizeVoice(response.data ?? response.result ?? response);
}

export async function getVoiceLyric(id: number): Promise<string> {
  const response = await request<Obj>("/voice/lyric", { id });
  const value = obj(response.data ?? response.result ?? response);
  return String(value.lyric ?? value.lyricText ?? value.content ?? "");
}

export async function transcribeVoice(input: {
  radioId: number;
  programId: number;
  position?: number;
}): Promise<void> {
  await request(
    "/voicelist/trans",
    {
      radioId: input.radioId,
      programId: input.programId,
      position: input.position ?? 1,
    },
    false,
    { method: "POST" },
  );
}

export async function deleteVoices(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await request("/voice/delete", { ids: ids.join(",") }, false, {
    method: "POST",
  });
}

export interface VoiceUploadInput {
  songName?: string;
  voiceListId?: number;
  description?: string;
  categoryId?: number;
  secondCategoryId?: number;
  autoPublish?: boolean;
  privacy?: boolean;
  publishTime?: number;
}

export async function uploadVoice(
  file: File,
  input: VoiceUploadInput = {},
): Promise<VoiceItem | null> {
  const body = new FormData();
  body.append("songFile", file, file.name);
  const response = await request<Obj>(
    "/voice/upload",
    {
      songName: input.songName,
      voiceListId: input.voiceListId,
      description: input.description,
      categoryId: input.categoryId,
      secondCategoryId: input.secondCategoryId,
      autoPublish: input.autoPublish ? 1 : 0,
      privacy: input.privacy ? 1 : 0,
      publishTime: input.publishTime,
    },
    false,
    { method: "POST", body },
  );
  return normalizeVoice(response.data ?? response.result ?? response);
}
