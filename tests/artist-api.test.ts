import test from "node:test";
import assert from "node:assert/strict";
import {
  getArtistDynamic,
  getArtistIntroduction,
  getArtistNewMvs,
  getArtistTopSongs,
} from "../src/api/artist.ts";

test("artist content APIs normalize description, stats, songs and new MVs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/artist/desc") {
      assert.equal(url.searchParams.get("id"), "7");
      return Response.json({ briefDesc: "歌手简介", introduction: [{ ti: "经历", txt: "从这里开始" }] });
    }
    if (url.pathname === "/artist/detail/dynamic") {
      return Response.json({ data: { followed: true, musicSize: 50, albumSize: 4, mvSize: 2, fansCount: 99 } });
    }
    if (url.pathname === "/artist/top/song") {
      return Response.json({ songs: [{ id: 8, name: "热门歌曲", ar: [{ id: 7, name: "歌手" }], al: { id: 3, name: "专辑", picUrl: "pic" } }] });
    }
    assert.equal(url.pathname, "/artist/new/mv");
    assert.equal(url.searchParams.get("limit"), "20");
    return Response.json({ data: [{ id: 11, name: "最新 MV", cover: "cover", artistName: "歌手" }] });
  };
  try {
    const description = await getArtistIntroduction(7);
    assert.equal(description.briefDesc, "歌手简介");
    assert.equal(description.introduction[0]?.title, "经历");
    const stats = await getArtistDynamic(7);
    assert.equal(stats.mvSize, 2);
    const songs = await getArtistTopSongs(7);
    assert.equal(songs[0]?.name, "热门歌曲");
    const mvs = await getArtistNewMvs();
    assert.equal(mvs[0]?.kind, "mv");
    assert.equal(mvs[0]?.id, "11");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
