import test from "node:test";
import assert from "node:assert/strict";
import { getVideoGroups, getVideoTimeline, getVideosByGroup } from "../src/api/videos.ts";

test("video APIs normalize timelines and groups", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/video/group/list") {
      return Response.json({ data: [{ id: 7, name: "音乐现场" }] });
    }
    if (url.pathname === "/video/group") {
      assert.equal(url.searchParams.get("id"), "7");
    }
    return Response.json({ data: { datas: [{ vid: "v1", title: "视频", coverUrl: "cover", creator: { nickname: "作者" } }] } });
  };
  try {
    assert.equal((await getVideoGroups())[0]?.name, "音乐现场");
    assert.equal((await getVideoTimeline())[0]?.name, "视频");
    assert.equal((await getVideosByGroup(7))[0]?.creatorName, "作者");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
