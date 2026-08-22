import { request } from "./client.ts";

export async function updatePlaylistTags(
  id: number,
  tags: string,
): Promise<void> {
  await request("/playlist/tags/update", { id, tags }, false, {
    method: "POST",
  });
}

export async function updatePlaylistCover(
  id: number,
  file: File,
): Promise<void> {
  const body = new FormData();
  body.append("imgFile", file, file.name);
  body.append("id", String(id));
  await request("/playlist/cover/update", {}, false, { method: "POST", body });
}
