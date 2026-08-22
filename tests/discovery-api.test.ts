import test from "node:test";
import assert from "node:assert/strict";
import {
  getPersonalizedMvs,
  getPersonalizedNewSongs,
  getPrivateContent,
  getPrivateContentList,
  getRecommendResources,
} from "../src/api/discovery.ts";

test("discovery endpoints normalize new songs, MVs and private content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("personalized/newsong"))
      return Response.json({
        result: [
          { id: 1, name: "新歌", ar: [{ name: "歌手" }], al: { name: "专辑" } },
        ],
      });
    if (url.includes("personalized/mv"))
      return Response.json({
        result: [
          { id: 2, name: "推荐 MV", picUrl: "cover", artistName: "导演" },
        ],
      });
    if (url.includes("personalized/privatecontent/list"))
      return Response.json({
        result: [
          { id: 4, name: "独家列表", cover: "cover", artistName: "创作者" },
        ],
      });
    return Response.json({
      result: [
        { id: 3, name: "独家放送", cover: "cover", artistName: "创作者" },
      ],
    });
  };
  try {
    assert.equal((await getPersonalizedNewSongs())[0]?.name, "新歌");
    assert.equal((await getPersonalizedMvs())[0]?.kind, "mv");
    assert.equal((await getPrivateContent())[0]?.kind, "video");
    assert.equal((await getPrivateContentList())[0]?.name, "独家列表");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recommend resource normalizes daily playlist resources", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/recommend/resource");
      return Response.json({ recommend: [{ id: 8, name: "每日歌单", picUrl: "cover", trackCount: 12, creator: { userId: 2, nickname: "推荐者" } }] });
    };
    const resources = await getRecommendResources();
    assert.equal(resources[0]?.name, "每日歌单");
    assert.equal(resources[0]?.creatorName, "推荐者");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
