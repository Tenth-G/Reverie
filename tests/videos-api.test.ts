import test from "node:test";
import assert from "node:assert/strict";
import {
  getExclusiveMvs,
  getMvAll,
  getMvFirst,
  getMvToplist,
  getVideoGroups,
  getVideoTimeline,
  getVideosByGroup,
} from "../src/api/videos.ts";

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

test("MV list APIs forward filters and normalize MV records", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const row = { id: 21, name: "MV", cover: "cover", artistName: "歌手", duration: 120000 };
    if (url.pathname === "/top/mv") {
      assert.equal(url.searchParams.get("area"), "港台");
      return Response.json({ data: [row] });
    }
    if (url.pathname === "/mv/first") {
      assert.equal(url.searchParams.get("area"), "港台");
      return Response.json({ data: [row] });
    }
    if (url.pathname === "/mv/all") {
      assert.equal(url.searchParams.get("area"), "港台");
      assert.equal(url.searchParams.get("type"), "现场版");
      assert.equal(url.searchParams.get("order"), "最新");
      return Response.json({ data: [row] });
    }
    assert.equal(url.pathname, "/mv/exclusive/rcmd");
    return Response.json({ data: [row] });
  };
  try {
    const top = await getMvToplist("港台");
    const first = await getMvFirst("港台");
    const all = await getMvAll("港台", "现场版", "最新");
    const exclusive = await getExclusiveMvs();
    for (const list of [top, first, all, exclusive]) {
      assert.equal(list[0]?.kind, "mv");
      assert.equal(list[0]?.id, "21");
      assert.equal(list[0]?.creatorName, "歌手");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
