import test from "node:test";
import assert from "node:assert/strict";
import {
  getDigitalAlbumDetail,
  getDigitalAlbumSales,
  getPurchasedDigitalAlbums,
  orderDigitalAlbum,
} from "../src/api/digitalAlbum.ts";

test("digital album APIs normalize detail, sales and purchased records", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("sales"))
      return Response.json({
        data: { list: [{ albumId: 2, salesCount: 99 }] },
      });
    if (url.includes("purchased"))
      return Response.json({
        data: { list: [{ id: 3, albumName: "已购", artistName: "歌手" }] },
      });
    return Response.json({
      data: {
        id: 2,
        name: "专辑",
        artistName: "歌手",
        price: 12.5,
        songs: [{ id: 8, name: "歌曲", ar: [{ name: "歌手" }] }],
      },
    });
  };
  try {
    const detail = await getDigitalAlbumDetail(2);
    assert.equal(detail?.name, "专辑");
    assert.equal(detail?.songs[0]?.id, 8);
    assert.equal((await getDigitalAlbumSales([2]))[2], 99);
    assert.equal((await getPurchasedDigitalAlbums())[0]?.name, "已购");
    assert.match(urls[0]!, /digitalAlbum\/detail\?id=2/);
    assert.match(urls[1]!, /digitalAlbum\/sales\?ids=2/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("digital album ordering uses payment and quantity parameters", async () => {
  const originalFetch = globalThis.fetch;
  let call: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    call = { url: String(input), init };
    return Response.json({ code: 200 });
  };
  try {
    await orderDigitalAlbum({ id: 7, payment: "alipay", quantity: 2 });
    assert.equal(new URL(call!.url).pathname, "/digitalAlbum/ordering");
    assert.equal(new URL(call!.url).searchParams.get("payment"), "alipay");
    assert.equal(new URL(call!.url).searchParams.get("quantity"), "2");
    assert.equal(call!.init?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
