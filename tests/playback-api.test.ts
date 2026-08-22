import test from "node:test";
import assert from "node:assert/strict";
import { getFirstListenInfo, getIntelligentPlaylist, getSongVector } from "../src/api/playback.ts";

test("playback APIs normalize intelligent queue, song vectors and first-listen info", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/playmode/intelligence/list") {
      return Response.json({ data: { songs: [{ id: 1, name: "推荐", ar: [{ name: "歌手" }], al: { name: "专辑" } }] } });
    }
    if (path === "/playmode/song/vector") return Response.json({ data: [{ id: "v1" }] });
    return Response.json({ data: { firstTime: 1700000000000, playCount: 4, description: "首次播放" } });
  };
  try {
    assert.equal((await getIntelligentPlaylist(9))[0]?.name, "推荐");
    assert.equal((await getSongVector([1, 2])).length, 1);
    const info = await getFirstListenInfo(1);
    assert.equal(info?.playCount, 4);
    assert.equal(info?.description, "首次播放");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
