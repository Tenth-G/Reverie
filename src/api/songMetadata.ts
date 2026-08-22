import { request } from "./client.ts";
import type { SongChorusInfo, SongCreatorInfo, SongMetadata } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export async function getSongMetadata(id: number): Promise<SongMetadata> {
  const [wiki, creators, chorus] = await Promise.allSettled([
    request<Obj>("/song/wiki/summary", { id }, false),
    request<Obj>("/song/creators", { songId: id }, false),
    request<Obj>("/song/chorus", { ids: JSON.stringify([id]) }, false),
  ]);
  const wikiValue =
    wiki.status === "fulfilled" ? obj(wiki.value.data ?? wiki.value) : {};
  const summary = String(
    wikiValue.summary ??
      wikiValue.description ??
      wikiValue.desc ??
      obj(wikiValue.block).summary ??
      "",
  );
  const creatorValue = creators.status === "fulfilled" ? creators.value : {};
  const creatorList = arr(
    creatorValue.creators ?? creatorValue.data ?? creatorValue.list,
  );
  const creatorItems = creatorList
    .map((raw) => {
      const value = obj(raw);
      return {
        userId: Number(value.userId ?? value.id ?? 0),
        name: String(value.name ?? value.nickname ?? value.creatorName ?? ""),
        role: String(value.role ?? value.type ?? value.job ?? ""),
      } satisfies SongCreatorInfo;
    })
    .filter((item) => item.name);
  const chorusValue = chorus.status === "fulfilled" ? chorus.value : {};
  const chorusList = arr(
    chorusValue.data ?? chorusValue.chorus ?? chorusValue.list,
  );
  const chorusItems = chorusList
    .map((raw) => {
      const value = obj(raw);
      return {
        start: Number(value.start ?? value.startTime ?? 0),
        end: Number(value.end ?? value.endTime ?? 0),
      } satisfies SongChorusInfo;
    })
    .filter((item) => item.end > item.start);
  return { summary, creators: creatorItems, chorus: chorusItems };
}
