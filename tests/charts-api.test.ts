import test from "node:test";
import assert from "node:assert/strict";
import { getChartSongs, getChartSummaries } from "../src/api/charts.ts";

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
