import test from "node:test";
import assert from "node:assert/strict";
import {
  getBroadcastCategories,
  getBroadcastChannels,
  getBroadcastCollected,
  getPodcastProgramDetail,
  getSportRadio,
  toggleBroadcastSubscription,
} from "../src/api/broadcast.ts";
import { getPodcastToplist } from "../src/api/broadcast.ts";

test("broadcast APIs normalize channels and sport recommendations", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("category"))
      return Response.json({ data: { categories: [{ id: 1, name: "新闻" }] } });
    if (url.includes("sport"))
      return Response.json({
        data: [{ id: 3, name: "跑步歌", ar: [{ name: "歌手" }] }],
      });
    return Response.json({
      data: {
        list: [{ id: 2, name: "频道", picUrl: "cover", subscribed: true }],
      },
    });
  };
  try {
    assert.equal((await getBroadcastCategories())[0]?.name, "新闻");
    assert.equal((await getBroadcastChannels())[0]?.id, 2);
    assert.equal((await getBroadcastCollected())[0]?.subscribed, true);
    assert.equal((await getSportRadio(120))[0]?.id, 3);
    assert.match(urls[0]!, /broadcast\/category\/region\/get/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("broadcast subscription forwards state and POST method", async () => {
  const originalFetch = globalThis.fetch;
  let call: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    call = { url: String(input), init };
    return Response.json({ code: 200 });
  };
  try {
    await toggleBroadcastSubscription(2, true);
    assert.equal(new URL(call!.url).pathname, "/broadcast/sub");
    assert.equal(new URL(call!.url).searchParams.get("t"), "1");
    assert.equal(call!.init?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("podcast toplist normalizes new and hot radio records", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/dj/toplist");
    assert.equal(url.searchParams.get("type"), "hot");
    return Response.json({ data: { list: [{ id: 8, name: "热门电台", dj: { nickname: "主播" } }] } });
  };
  try {
    const radios = await getPodcastToplist("hot", 10, 0);
    assert.equal(radios[0]?.name, "热门电台");
    assert.equal(radios[0]?.djName, "主播");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("podcast program detail normalizes metadata and main song", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(new URL(String(input)).pathname, "/dj/program/detail");
    return Response.json({
      program: {
        id: 11,
        name: "节目详情",
        description: "节目介绍",
        coverUrl: "cover",
        radio: { name: "电台" },
        dj: { nickname: "主播" },
        createTime: 1700000000000,
        duration: 180000,
        commentCount: 4,
        mainSong: { id: 22, name: "节目歌曲", ar: [{ name: "歌手" }] },
      },
    });
  };
  try {
    const detail = await getPodcastProgramDetail(11);
    assert.equal(detail.name, "节目详情");
    assert.equal(detail.radioName, "电台");
    assert.equal(detail.djName, "主播");
    assert.equal(detail.song?.id, 22);
    assert.equal(detail.commentCount, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
