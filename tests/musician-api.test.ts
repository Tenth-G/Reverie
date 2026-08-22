import test from "node:test";
import assert from "node:assert/strict";
import {
  getMusicianCloudbean,
  getMusicianOverview,
  getMusicianPlayTrend,
  getMusicianStageTasks,
  getMusicianTasks,
  musicianSign,
  obtainMusicianCloudbean,
} from "../src/api/musician.ts";

test("musician APIs normalize cloudbean, overview, trend and tasks", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("cloudbean") && !url.includes("obtain"))
      return Response.json({ data: { cloudbean: 88 } });
    if (url.includes("data/overview"))
      return Response.json({
        data: { songCount: 3, playCount: 400, fanCount: 12 },
      });
    if (url.includes("play/trend"))
      return Response.json({
        data: { list: [{ date: "2026-08-22", count: 9 }] },
      });
    return Response.json({
      data: {
        list: [{ id: 7, taskName: "任务", cloudbean: 5, userMissionId: 8 }],
      },
    });
  };
  try {
    assert.equal(await getMusicianCloudbean(), 88);
    assert.equal((await getMusicianOverview()).fanCount, 12);
    assert.equal((await getMusicianPlayTrend())[0]?.count, 9);
    assert.equal((await getMusicianTasks())[0]?.userMissionId, 8);
    assert.equal((await getMusicianStageTasks())[0]?.reward, 5);
    assert.match(urls[0]!, /musician\/cloudbean/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("musician mutations use expected routes and methods", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json({ code: 200 });
  };
  try {
    await musicianSign();
    await obtainMusicianCloudbean(8, "daily");
    assert.equal(new URL(calls[0]!.url).pathname, "/musician/sign");
    assert.equal(calls[0]!.init?.method, "POST");
    assert.equal(new URL(calls[1]!.url).pathname, "/musician/cloudbean/obtain");
    assert.equal(new URL(calls[1]!.url).searchParams.get("id"), "8");
    assert.equal(calls[1]!.init?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
