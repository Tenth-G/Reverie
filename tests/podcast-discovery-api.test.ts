import test from "node:test";
import assert from "node:assert/strict";
import { getPodcastBanners, getPodcastCategories, getPodcastCategoryRecommendations, getPodcastHotRadios } from "../src/api/broadcast.ts";

test("podcast discovery APIs normalize categories, banners and radio lists", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/dj/catelist") return Response.json({ categories: [{ id: 1, name: "知识" }] });
    if (path === "/dj/recommend/type") return Response.json({ data: [{ id: 2, name: "分类电台", picUrl: "cover" }] });
    if (path === "/dj/radio/hot") return Response.json({ data: [{ id: 3, name: "热门电台" }] });
    return Response.json({ data: [{ pic: "banner", typeTitle: "播客推荐" }] });
  };
  try {
    assert.equal((await getPodcastCategories())[0]?.name, "知识");
    assert.equal((await getPodcastCategoryRecommendations(1))[0]?.name, "分类电台");
    assert.equal((await getPodcastHotRadios())[0]?.id, 3);
    assert.equal((await getPodcastBanners())[0]?.title, "播客推荐");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
