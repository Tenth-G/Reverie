import { request } from "./client.ts";
import type { PlaylistImportTaskStatus } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const first = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : undefined;

export type PlaylistImportInput =
  | {
      kind: "text";
      value: string;
      playlistName?: string;
      importStarPlaylist?: boolean;
    }
  | {
      kind: "links";
      value: string[];
      playlistName?: string;
      importStarPlaylist?: boolean;
    }
  | {
      kind: "local";
      value: Array<{ name: string; artist?: string; album?: string }>;
      importStarPlaylist?: boolean;
    };

function normalizeStatus(raw: unknown): PlaylistImportTaskStatus {
  const value = obj(raw);
  const data = obj(value.data ?? value.result ?? value);
  const rawStatus = String(
    data.status ?? data.taskStatus ?? data.state ?? "pending",
  ).toLowerCase();
  const status =
    rawStatus.includes("success") || rawStatus === "done" || rawStatus === "2"
      ? "success"
      : rawStatus.includes("fail") || rawStatus === "error" || rawStatus === "3"
        ? "failed"
        : "running";
  return {
    id: String(data.id ?? data.taskId ?? first(data.taskIds) ?? ""),
    status,
    progress: Number(data.progress ?? data.percent ?? 0),
    message: String(data.message ?? data.msg ?? data.error ?? ""),
    playlistId: Number(data.playlistId ?? data.pid ?? 0) || undefined,
    playlistName: String(data.playlistName ?? data.name ?? "") || undefined,
  };
}

export async function createPlaylistImportTask(
  input: PlaylistImportInput,
): Promise<string> {
  const params: Record<string, string | number | boolean | undefined> = {
    importStarPlaylist: input.importStarPlaylist ?? false,
  };
  if (input.kind === "text") {
    params.text = input.value;
    params.playlistName = input.playlistName;
  } else if (input.kind === "links") {
    params.link = JSON.stringify(input.value);
    params.playlistName = input.playlistName;
  } else {
    params.local = JSON.stringify(input.value);
  }
  const response = await request<Obj>(
    "/playlist/import/name/task/create",
    params,
    false,
  );
  const value = obj(response.data ?? response.result ?? response);
  const id = String(
    value.id ?? value.taskId ?? first(value.taskIds) ?? response.taskId ?? "",
  );
  if (!id) throw new Error("创建歌单导入任务失败");
  return id;
}

export async function getPlaylistImportTaskStatus(
  id: string,
): Promise<PlaylistImportTaskStatus> {
  if (!id) throw new Error("缺少导入任务 ID");
  const response = await request<Obj>(
    "/playlist/import/task/status",
    { id },
    false,
  );
  return normalizeStatus(response);
}
