import test from "node:test";
import assert from "node:assert/strict";
import {
  getRelatedPlaylists,
  getRelatedVideos,
  getSimilarArtists,
  getSimilarSongs,
} from "../src/api/related.ts";

test("related recommendation wrappers normalize playlists, artists, songs and videos", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/related/playlist") {
      return Response.json({ playlists: [{ id: 1, name: "相关", coverImgUrl: "a" }] });
    }
    if (path === "/simi/playlist") {
      return Response.json({ playlists: [{ id: 1, name: "重复", coverImgUrl: "a" }, { id: 2, name: "相似", picUrl: "b" }] });
    }
    if (path === "/playlist/detail/rcmd/get") return Response.json({ playlists: [] });
    if (path === "/simi/artist") return Response.json({ artists: [{ id: 8, name: "相似歌手", picUrl: "c" }] });
    if (path === "/simi/song") return Response.json({ songs: [{ id: 9, name: "相似歌曲", ar: [{ name: "歌手" }], al: { name: "专辑" } }] });
    return Response.json({ data: [{ id: "v1", title: "相关视频", coverUrl: "d" }] });
  };
  try {
    const playlists = await getRelatedPlaylists(7);
    assert.deepEqual(playlists.map((item) => item.id), [1, 2]);
    assert.equal((await getSimilarArtists(7))[0]?.name, "相似歌手");
    assert.equal((await getSimilarSongs(7))[0]?.name, "相似歌曲");
    assert.equal((await getRelatedVideos(7))[0]?.kind, "video");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
