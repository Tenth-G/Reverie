import { request } from "./client.ts";
import type { UgcContribution, UgcDevote, UgcResource } from "./types.ts";
type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
function resource(raw: unknown, kind: UgcResource["kind"]): UgcResource {
  const value = obj(raw);
  return {
    kind,
    id: Number(
      value.id ??
        value.songId ??
        value.albumId ??
        value.artistId ??
        value.mvId ??
        0,
    ),
    name: String(value.name ?? value.title ?? ""),
    description: String(value.description ?? value.desc ?? ""),
    coverUrl: String(value.picUrl ?? value.coverUrl ?? ""),
    extra: String(value.extra ?? value.reason ?? ""),
  };
}
export async function getUgcSong(id: number): Promise<UgcResource> {
  const response = await request<Obj>("/ugc/song/get", { id }, false);
  return resource(response.data ?? response.result ?? response, "song");
}
export async function getUgcAlbum(id: number): Promise<UgcResource> {
  const response = await request<Obj>("/ugc/album/get", { id }, false);
  return resource(response.data ?? response.result ?? response, "album");
}
export async function getUgcArtist(id: number): Promise<UgcResource> {
  const response = await request<Obj>("/ugc/artist/get", { id }, false);
  return resource(response.data ?? response.result ?? response, "artist");
}
export async function getUgcMv(id: number): Promise<UgcResource> {
  const response = await request<Obj>("/ugc/mv/get", { id }, false);
  return resource(response.data ?? response.result ?? response, "mv");
}
export async function searchUgcArtists(
  keyword: string,
  limit = 40,
): Promise<UgcResource[]> {
  const response = await request<Obj>(
    "/ugc/artist/search",
    { keyword, limit },
    false,
  );
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map((item) => resource(item, "artist"))
    .filter((item) => item.id > 0);
}
export async function getUgcContributions(
  input: {
    type?: number;
    auditStatus?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<UgcContribution[]> {
  const response = await request<Obj>("/ugc/detail", input, false);
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map((item) => {
      const value = obj(item);
      return {
        id: String(value.id ?? value.contributionId ?? ""),
        type: Number(value.type ?? 1),
        title: String(value.title ?? value.name ?? "贡献内容"),
        status: String(value.auditStatus ?? value.status ?? ""),
        createTime: Number(value.createTime ?? value.time ?? 0),
        description: String(value.description ?? value.reason ?? ""),
      } satisfies UgcContribution;
    })
    .filter((item) => item.id);
}
export async function getUgcDevote(): Promise<UgcDevote> {
  const response = await request<Obj>("/ugc/user/devote", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return {
    count: Number(value.count ?? value.total ?? 0),
    points: Number(value.points ?? value.score ?? 0),
    yunbei: Number(value.yunbei ?? value.cloudbean ?? 0),
  };
}
