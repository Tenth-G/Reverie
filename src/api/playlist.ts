import { request } from "./client.ts";
import type { PlaylistDynamicStats } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};

export async function addPlaylistTracks(
  playlistId: number,
  songIds: number[],
): Promise<void> {
  if (!playlistId || !songIds.length) return;
  await request(
    "/playlist/track/add",
    { pid: playlistId, ids: songIds.join(",") },
    false,
    { method: "POST" },
  );
}

export async function deletePlaylistTracks(
  playlistId: number,
  songIds: number[],
): Promise<void> {
  if (!playlistId || !songIds.length) return;
  await request(
    "/playlist/track/delete",
    { id: playlistId, ids: songIds.join(",") },
    false,
    { method: "POST" },
  );
}

export async function manipulatePlaylistTracks(
  playlistId: number,
  operation: "add" | "del",
  songIds: number[],
): Promise<void> {
  if (!playlistId || !songIds.length) return;
  await request(
    "/playlist/tracks",
    { op: operation, pid: playlistId, tracks: songIds.join(",") },
    false,
    { method: "POST" },
  );
}

export async function updatePlaylistOrder(
  playlistId: number,
  songIds: number[],
): Promise<void> {
  if (!playlistId || !songIds.length) return;
  await request(
    "/playlist/order/update",
    { id: playlistId, ids: songIds.join(",") },
    false,
    { method: "POST" },
  );
}

export async function getPlaylistDynamicStats(
  playlistId: number,
): Promise<PlaylistDynamicStats> {
  const response = await request<Obj>(
    "/playlist/detail/dynamic",
    { id: playlistId, s: 8 },
    false,
  );
  const value = obj(response.data ?? response);
  return {
    playCount: Number(value.playCount ?? value.playcount ?? 0),
    subscribedCount: Number(
      value.subscribedCount ?? value.subCount ?? value.followedCount ?? 0,
    ),
    commentCount: Number(value.commentCount ?? value.commentCountAll ?? 0),
    shareCount: Number(value.shareCount ?? 0),
    followed: Boolean(value.followed ?? value.subscribed ?? value.isSub),
  };
}
