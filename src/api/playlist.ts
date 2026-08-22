import { request } from "./client.ts";

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
