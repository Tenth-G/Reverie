import test from "node:test";
import assert from "node:assert/strict";
import {
  getStyleAlbums,
  getStyleArtists,
  getStyleDetail,
  getStylePlaylists,
  getStylePreference,
  getStyleSongs,
  getStyleTags,
} from "../src/api/style.ts";

test("style APIs normalize tags, preference and all content types", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    if (url.pathname === "/style/list") return Response.json({ data: [{ id: 1, name: "流行" }] });
    if (url.pathname === "/style/preference") return Response.json({ data: [{ tagId: 1, tagName: "流行" }] });
    if (url.pathname === "/style/detail") return Response.json({ data: { tagId: 1, tagName: "流行", desc: "介绍" } });
    if (url.pathname === "/style/song") return Response.json({ data: [{ id: 2, name: "歌曲", ar: [{ name: "歌手" }], al: { name: "专辑" } }] });
    if (url.pathname === "/style/artist") return Response.json({ data: [{ id: 3, name: "歌手" }] });
    if (url.pathname === "/style/album") return Response.json({ data: [{ id: 4, name: "专辑" }] });
    return Response.json({ data: [{ id: 5, name: "歌单" }] });
  };
  try {
    assert.equal((await getStyleTags())[0]?.name, "流行");
    assert.equal((await getStylePreference())[0]?.id, 1);
    assert.equal((await getStyleDetail(1)).description, "介绍");
    assert.equal((await getStyleSongs(1))[0]?.name, "歌曲");
    assert.equal((await getStyleArtists(1))[0]?.name, "歌手");
    assert.equal((await getStyleAlbums(1))[0]?.name, "专辑");
    assert.equal((await getStylePlaylists(1))[0]?.name, "歌单");
    assert.deepEqual(paths, [
      "/style/list",
      "/style/preference",
      "/style/detail",
      "/style/song",
      "/style/artist",
      "/style/album",
      "/style/playlist",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
