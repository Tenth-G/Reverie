import test from "node:test";
import assert from "node:assert/strict";
import {
  getArtistDynamic,
  getArtistIntroduction,
  getArtistNewMvs,
  getArtistMvs,
  getArtistNewSongs,
  getArtistSongs,
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

test("artist MV and new-song endpoints normalize artist content", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/artist/mv") {
        assert.equal(url.searchParams.get("id"), "7");
        return Response.json({ data: [{ id: 12, name: "歌手 MV", cover: "cover", artistName: "歌手" }] });
      }
      assert.equal(url.pathname, "/artist/new/song");
      assert.equal(url.searchParams.get("limit"), "5");
      return Response.json({ data: [{ id: 13, name: "新作品", ar: [{ name: "歌手" }], al: { name: "专辑" } }] });
    };
    const mvs = await getArtistMvs(7);
    const songs = await getArtistNewSongs(5);
    assert.equal(mvs[0]?.id, "12");
    assert.equal(songs[0]?.name, "新作品");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("artist full song endpoint forwards ordering and pagination", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/artist/songs");
      assert.equal(url.searchParams.get("id"), "7");
      assert.equal(url.searchParams.get("order"), "time");
      assert.equal(url.searchParams.get("limit"), "5");
      return Response.json({ data: { songs: [{ id: 14, name: "全部歌曲", ar: [{ name: "歌手" }], al: { name: "专辑" } }] } });
    };
    const songs = await getArtistSongs(7, "time", 5, 10);
    assert.equal(songs[0]?.name, "全部歌曲");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
