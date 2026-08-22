import test from "node:test";
import assert from "node:assert/strict";
import {
  getArtistToplist,
  getChartCities,
  getChartSongs,
  getChartSummaries,
  getDimensionChartDetail,
  getDimensionChartSongs,
} from "../src/api/charts.ts";

test("chart APIs normalize chart summaries and songs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/toplist/detail") {
      return Response.json({
        list: [
          {
            id: 19723756,
            name: "飙升榜",
            coverImgUrl: "cover",
            updateFrequency: "每天更新",
          },
        ],
      });
    }
    assert.equal(url.pathname, "/top/list");
    assert.equal(url.searchParams.get("id"), "19723756");
    return Response.json({
      playlist: {
        tracks: [
          {
            id: 1,
            name: "榜单歌曲",
            ar: [{ id: 2, name: "歌手" }],
            al: { id: 3, name: "专辑", picUrl: "pic" },
          },
        ],
      },
    });
  };
  try {
    const charts = await getChartSummaries();
    assert.equal(charts[0]?.name, "飙升榜");
    const songs = await getChartSongs(19723756);
    assert.equal(songs[0]?.name, "榜单歌曲");
    assert.equal(songs[0]?.artists, "歌手");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("dimension chart APIs forward city and style parameters", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/lbs/city/code") {
      assert.equal(url.searchParams.get("bizCode"), "chart");
      return Response.json({ data: [{ code: "110000", name: "北京", children: [{ code: "110100", name: "北京市" }] }] });
    }
    if (url.pathname === "/chart/detail") {
      assert.equal(url.searchParams.get("chartCode"), "CITY_STYLE_SONG_CHART");
      assert.equal(url.searchParams.get("targetId"), "110100_1020");
      assert.equal(url.searchParams.get("targetType"), "CITY_STYLE");
      return Response.json({ data: { name: "北京华语流行榜", description: "城市风格榜", songCount: 20 } });
    }
    assert.equal(url.pathname, "/chart/song/detail");
    assert.equal(url.searchParams.get("chartCode"), "CITY_STYLE_SONG_CHART");
    return Response.json({ data: [{ id: 9, name: "城市歌曲", ar: [{ id: 10, name: "歌手" }], al: { id: 11, name: "专辑", picUrl: "pic" } }] });
  };
  try {
    const cities = await getChartCities("chart");
    assert.equal(cities[0]?.id, "110000");
    assert.equal(cities[0]?.children[0]?.name, "北京市");
    const query = { chartCode: "CITY_STYLE_SONG_CHART" as const, targetId: "110100_1020", targetType: "CITY_STYLE" as const };
    const detail = await getDimensionChartDetail(query);
    assert.equal(detail.name, "北京华语流行榜");
    const songs = await getDimensionChartSongs(query);
    assert.equal(songs[0]?.name, "城市歌曲");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("artist toplist forwards region type and normalizes artists", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/toplist/artist");
    assert.equal(url.searchParams.get("type"), "3");
    return Response.json({ artists: [{ id: 8, name: "韩国歌手", picUrl: "avatar", musicSize: 12 }] });
  };
  try {
    const artists = await getArtistToplist(3);
    assert.equal(artists[0]?.name, "韩国歌手");
    assert.equal(artists[0]?.musicSize, 12);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
