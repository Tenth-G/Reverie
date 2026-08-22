import { request } from "./client.ts";
import type { SatiResource, SatiTag } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeResource(raw: unknown): SatiResource | null {
  const value = obj(raw);
  const id = Number(value.id ?? value.resourceId ?? value.programId ?? 0);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return {
    id,
    name: String(value.name ?? value.title ?? "助眠资源"),
    description: String(value.description ?? value.desc ?? ""),
    coverUrl: String(value.picUrl ?? value.coverUrl ?? value.coverImgUrl ?? ""),
    duration: Number(value.duration ?? value.durationMs ?? 0),
    subscribed: Boolean(value.subscribed ?? value.sub ?? value.isSub ?? false),
    playCount: Number(value.playCount ?? value.listenerCount ?? 0),
    audioUrl: String(value.audioUrl ?? value.url ?? ""),
  };
}

export async function getSatiTags(): Promise<SatiTag[]> {
  const response = await request<Obj>("/sati/tag/list", {}, false);
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map((item) => {
      const value = obj(item);
      return {
        id: String(value.id ?? value.tagId ?? ""),
        name: String(value.name ?? value.tagName ?? ""),
      };
    })
    .filter((item) => item.id && item.name);
}

export async function getSatiResources(tag?: string): Promise<SatiResource[]> {
  const response = await request<Obj>("/sati/resource/list", { tag }, false);
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map(normalizeResource)
    .filter((item): item is SatiResource => item !== null);
}

export async function getMoreSatiResources(
  id: number,
): Promise<SatiResource[]> {
  const response = await request<Obj>(
    "/sati/resource/list/more",
    { id },
    false,
  );
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map(normalizeResource)
    .filter((item): item is SatiResource => item !== null);
}

export async function getSatiTimeSceneResources(): Promise<SatiResource[]> {
  const response = await request<Obj>(
    "/sati/timescene/resources/get",
    {},
    false,
  );
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map(normalizeResource)
    .filter((item): item is SatiResource => item !== null);
}

export async function subscribeSatiResource(
  id: number,
  cancel = false,
): Promise<void> {
  await request("/sati/resource/sub", { id, cancel }, false, {
    method: "POST",
  });
}

export async function getSubscribedSatiResources(): Promise<SatiResource[]> {
  const response = await request<Obj>("/sati/resource/sub/list", {}, false);
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map(normalizeResource)
    .filter((item): item is SatiResource => item !== null);
}
