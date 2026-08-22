import { normalizeSong, request } from "./client.ts";
import type { DigitalAlbum, Song } from "./types.ts";

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function normalizeAlbum(raw: unknown): DigitalAlbum | null {
  const value = obj(raw);
  const id = Number(value.id ?? value.albumId ?? value.resourceId ?? 0);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return {
    id,
    name: String(value.name ?? value.albumName ?? "数字专辑"),
    artistName: String(
      value.artistName ?? value.artist ?? value.creatorName ?? "",
    ),
    coverUrl: String(value.picUrl ?? value.coverUrl ?? value.coverImgUrl ?? ""),
    description: String(value.description ?? value.desc ?? ""),
    price: Number(value.price ?? value.amount ?? value.originPrice ?? 0),
    sales: Number(value.sales ?? value.salesCount ?? value.saleCount ?? 0),
    purchased: Boolean(
      value.purchased ?? value.owned ?? value.isBought ?? false,
    ),
    songs: arr(value.songs ?? value.trackList ?? value.tracks)
      .map(normalizeSong)
      .filter((item): item is Song => item !== null),
  };
}

export async function getDigitalAlbumDetail(
  id: number,
): Promise<DigitalAlbum | null> {
  const response = await request<Obj>("/digitalAlbum/detail", { id });
  return normalizeAlbum(response.data ?? response.result ?? response);
}

export async function getDigitalAlbumSales(
  ids: number[],
): Promise<Record<number, number>> {
  if (!ids.length) return {};
  const response = await request<Obj>("/digitalAlbum/sales", {
    ids: ids.join(","),
  });
  const value = obj(response.data ?? response.result ?? response);
  const result: Record<number, number> = {};
  for (const item of arr(value.list ?? value.records ?? value)) {
    const row = obj(item);
    const id = Number(row.id ?? row.albumId ?? 0);
    if (id > 0) result[id] = Number(row.sales ?? row.salesCount ?? 0);
  }
  return result;
}

export async function getPurchasedDigitalAlbums(
  limit = 30,
  offset = 0,
): Promise<DigitalAlbum[]> {
  const response = await request<Obj>("/digitalAlbum/purchased", {
    limit,
    offset,
  });
  return arr(
    obj(response.data ?? response.result ?? response).list ??
      response.data ??
      response,
  )
    .map(normalizeAlbum)
    .filter((item): item is DigitalAlbum => item !== null);
}

export async function orderDigitalAlbum(input: {
  id: number;
  payment: "balance" | "alipay" | "wxpay";
  quantity?: number;
}): Promise<Obj> {
  return request<Obj>(
    "/digitalAlbum/ordering",
    { id: input.id, payment: input.payment, quantity: input.quantity ?? 1 },
    false,
    { method: "POST" },
  );
}
