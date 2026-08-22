import test from "node:test";
import assert from "node:assert/strict";
import {
  convertMlogToVideoId,
  getMlogUrl,
  getMusicMlogRecommendations,
} from "../src/api/mlog.ts";

test("mlog recommendation and conversion endpoints normalize results", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    if (url.pathname === "/mlog/music/rcmd") {
      assert.equal(url.searchParams.get("songid"), "9");
      assert.equal(url.searchParams.get("limit"), "2");
      return Response.json({ data: { resources: [{ id: "m1", title: "动态一", coverUrl: "c" }] } });
    }
    assert.equal(url.pathname, "/mlog/to/video");
    assert.equal(url.searchParams.get("id"), "m1");
    return Response.json({ data: { videoId: "v1" } });
  };
  try {
    assert.equal((await getMusicMlogRecommendations(9, 0, 2))[0]?.id, "m1");
    assert.equal(await convertMlogToVideoId("m1"), "v1");
    assert.deepEqual(paths, ["/mlog/music/rcmd", "/mlog/to/video"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mlog URL forwards requested resolution", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/mlog/url");
    assert.equal(url.searchParams.get("id"), "m1");
    assert.equal(url.searchParams.get("res"), "720");
    return Response.json({ data: { url: "https://media.test/m1.mp4", duration: 1200, width: 720, height: 404 } });
  };
  try {
    assert.deepEqual(await getMlogUrl("m1", 720), {
      id: "m1",
      url: "https://media.test/m1.mp4",
      duration: 1200,
      size: 0,
      width: 720,
      height: 404,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
