import test from "node:test";
import assert from "node:assert/strict";
import { checkSongAvailability, getDynamicSongCover, getSongLikeStatus } from "../src/api/songStatus.ts";

test("song status APIs normalize like state, dynamic cover and availability", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/song/like/check") return Response.json({ data: [{ id: 1, like: true }, { id: 2, like: false }] });
    if (path === "/song/dynamic/cover") return Response.json({ data: { dynamicCoverUrl: "dynamic-cover" } });
    return Response.json({ success: true, message: "歌曲可播放" });
  };
  try {
    const liked = await getSongLikeStatus([1, 2]);
    assert.equal(liked[1], true);
    assert.equal(liked[2], false);
    assert.equal(await getDynamicSongCover(1), "dynamic-cover");
    assert.deepEqual(await checkSongAvailability(1), { songId: 1, available: true, message: "歌曲可播放" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
