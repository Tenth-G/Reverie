import { normalizeSong, request } from "./client.ts";
import type { ListenTogetherRoom, ListenTogetherState, Song } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeRoom(raw: unknown): ListenTogetherRoom | null {
  const value = obj(raw);
  const nestedRoom = obj(value.room);
  const inviter = obj(value.inviter);
  const owner = obj(value.owner);
  const users = Array.isArray(value.users) ? value.users : [];
  const roomId = String(value.roomId ?? value.id ?? nestedRoom.roomId ?? "");
  if (!roomId) return null;
  return {
    roomId,
    inviterId: Number(value.inviterId ?? inviter.userId ?? 0) || undefined,
    ownerId:
      Number(value.ownerId ?? value.creatorId ?? owner.userId ?? 0) ||
      undefined,
    status: String(value.status ?? value.roomStatus ?? "active"),
    memberCount: Number(value.memberCount ?? value.memberNum ?? users.length),
    maxMemberCount: Number(value.maxMemberCount ?? value.maxMemberNum ?? 2),
    createdAt: Number(value.createdAt ?? value.createTime ?? 0),
  };
}

function normalizePlaylist(raw: unknown): Song[] {
  const value = obj(raw);
  return arr(value.songs ?? value.playlist ?? value.list ?? raw)
    .map((item) => normalizeSong(obj(item).song ?? item))
    .filter((song): song is Song => song !== null);
}

export async function createListenTogetherRoom(): Promise<ListenTogetherRoom> {
  const response = await request<Obj>(
    "/listentogether/room/create",
    {},
    false,
    { method: "POST" },
  );
  const room = normalizeRoom(response.data ?? response.room ?? response);
  if (!room) throw new Error("创建一起听房间失败");
  return room;
}

export async function checkListenTogetherRoom(
  roomId: string,
): Promise<ListenTogetherRoom> {
  const response = await request<Obj>(
    "/listentogether/room/check",
    { roomId },
    false,
  );
  const room = normalizeRoom(response.data ?? response.room ?? response);
  if (!room) throw new Error("一起听房间不存在");
  return room;
}

export async function getListenTogetherStatus(): Promise<ListenTogetherState> {
  const response = await request<Obj>("/listentogether/status", {}, false);
  const value = obj(response.data ?? response);
  const room = normalizeRoom(value.room ?? value);
  return {
    room,
    currentSongId: Number(
      value.songId ?? value.currentSongId ?? value.playingSongId ?? 0,
    ),
    playing: Boolean(value.playStatus ?? value.playing),
    progress: Number(value.progress ?? value.position ?? 0),
    playlist: normalizePlaylist(value),
  };
}

export async function getListenTogetherPlaylist(
  roomId: string,
): Promise<Song[]> {
  const response = await request<Obj>(
    "/listentogether/sync/playlist/get",
    { roomId },
    false,
  );
  return normalizePlaylist(response.data ?? response);
}

export async function endListenTogetherRoom(roomId: string): Promise<void> {
  await request("/listentogether/end", { roomId }, false, { method: "POST" });
}

export async function acceptListenTogetherInvitation(
  roomId: string,
  inviterId: number,
): Promise<void> {
  await request("/listentogether/accept", { roomId, inviterId }, false, {
    method: "POST",
  });
}

export async function sendListenTogetherHeartbeat(input: {
  roomId: string;
  songId: number;
  playStatus: boolean;
  progress: number;
}): Promise<void> {
  await request(
    "/listentogether/heatbeat",
    {
      roomId: input.roomId,
      songId: input.songId,
      playStatus: input.playStatus,
      progress: input.progress,
    },
    false,
    { method: "POST" },
  );
}

export async function sendListenTogetherCommand(input: {
  roomId: string;
  commandType: string;
  progress?: number;
  playStatus?: boolean;
  formerSongId?: number;
  targetSongId?: number;
  clientSeq?: number;
}): Promise<void> {
  await request(
    "/listentogether/play/command",
    {
      roomId: input.roomId,
      commandType: input.commandType,
      progress: input.progress ?? 0,
      playStatus: input.playStatus ?? false,
      formerSongId: input.formerSongId,
      targetSongId: input.targetSongId,
      clientSeq: input.clientSeq ?? Date.now(),
    },
    false,
    { method: "POST" },
  );
}
