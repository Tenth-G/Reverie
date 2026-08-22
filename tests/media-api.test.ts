import test from "node:test";
import assert from "node:assert/strict";
import {
  getMediaDetail,
  getMediaUrl,
  getRelatedMedia,
  getMediaStats,
  normalizeMediaDetail,
} from "../src/api/media.ts";
import type { SearchMediaInfo } from "../src/api/types.ts";

const fallback: SearchMediaInfo = {
  id: "mv-1",
  name: "搜索标题",
  coverUrl: "cover",
  creatorName: "作者",
  duration: 1000,
  playCount: 3,
  kind: "mv",
};

test("media detail normalizes metadata and preserves search fallback", () => {
  const detail = normalizeMediaDetail(
    {
      id: 1,
      name: "详情标题",
      cover: "detail-cover",
      artistName: "详情作者",
      duration: 12000,
      playCount: 88,
      desc: "介绍",
      tags: [{ name: "现场" }],
      commentCount: 7,
    },
    fallback,
  );
  assert.equal(detail.name, "详情标题");
  assert.equal(detail.coverUrl, "detail-cover");
  assert.equal(detail.description, "介绍");
  assert.deepEqual(detail.tags, ["现场"]);
  assert.equal(detail.commentCount, 7);
});

test("media detail, url and related routes use media kind-specific parameters", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("/mv/detail"))
      return Response.json({ data: { name: "MV详情" } });
    if (url.includes("/mv/url"))
      return Response.json({ data: { url: "https://media" } });
    if (url.includes("/simi/mv"))
      return Response.json({ mvs: [{ id: 2, name: "相关 MV" }] });
    return Response.json({ code: 200 });
  };
  try {
    const detail = await getMediaDetail(fallback);
    const url = await getMediaUrl(fallback, 720);
    const related = await getRelatedMedia(fallback);
    assert.equal(detail.name, "MV详情");
    assert.equal(url, "https://media");
    assert.equal(related[0]?.name, "相关 MV");
    assert.match(urls[0]!, /mvid=mv-1/);
    assert.match(urls[1]!, /r=720/);
    assert.match(urls[2]!, /mvid=mv-1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("media advanced stats normalizes like, share, comment and subscription counts", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.match(String(input), /mv\/detail\/info/);
    return Response.json({
      data: { likedCount: 3, shareCount: 4, commentCount: 5, subCount: 6 },
    });
  };
  try {
    const stats = await getMediaStats({
      id: "mv-1",
      name: "MV",
      coverUrl: "",
      creatorName: "",
      duration: 0,
      playCount: 0,
      kind: "mv",
    });
    assert.deepEqual(stats, {
      likedCount: 3,
      shareCount: 4,
      commentCount: 5,
      subCount: 6,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
