import test from "node:test";
import assert from "node:assert/strict";
import {
  getBroadcastCategories,
  getBroadcastChannels,
  getBroadcastCollected,
  getDifmChannels,
  getDifmSubscribedChannels,
  getDifmTracks,
  getPodcastProgramDetail,
  getPodcastProgramHoursToplist,
  getPodcastProgramToplist,
  getPodcastAdvancedToplist,
  getPodcastTodayPreferred,
  getSportRadio,
  toggleBroadcastSubscription,
  toggleDifmChannel,
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

test("DIFM APIs normalize channels, tracks and subscription routes", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method?: string }> = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, method: init?.method });
    if (url.includes("playing/tracks/list"))
      return Response.json({ data: { tracks: [{ id: 31, name: "DIFM 歌曲", ar: [{ name: "歌手" }] }] } });
    if (url.includes("subscribe/channels/get"))
      return Response.json({ data: { channels: [{ id: 2, name: "收藏频道" }] } });
    return Response.json({ data: { channels: [{ id: 1, name: "频道", picUrl: "cover" }] } });
  };
  try {
    const channels = await getDifmChannels(1);
    const subscribed = await getDifmSubscribedChannels(1);
    const tracks = await getDifmTracks(1, 1, 5);
    await toggleDifmChannel(1, true);
    await toggleDifmChannel(1, false);
    assert.equal(channels[0]?.name, "频道");
    assert.equal(subscribed[0]?.subscribed, true);
    assert.equal(tracks[0]?.name, "DIFM 歌曲");
    assert.match(calls[0]!.url, /all\/style\/channel/);
    assert.equal(calls.at(-2)?.method, "POST");
    assert.equal(calls.at(-1)?.method, "POST");
    assert.match(calls.at(-1)!.url, /channel\/unsubscribe/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("podcast program rankings forward routes and normalize program records", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    return Response.json({ data: [{ id: 9, name: "节目榜", radio: { name: "电台" }, score: 88, mainSong: { id: 90, name: "榜单歌曲", ar: [{ name: "歌手" }] } }] });
  };
  try {
    assert.equal((await getPodcastProgramToplist(10, 20))[0]?.name, "节目榜");
    assert.equal((await getPodcastProgramHoursToplist(10))[0]?.song?.id, 90);
    assert.equal((await getPodcastTodayPreferred(1))[0]?.radioName, "电台");
    assert.deepEqual(paths, ["/dj/program/toplist", "/dj/program/toplist/hours", "/dj/today/perfered"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("advanced podcast rankings select the documented toplist routes", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    return Response.json({ data: { list: [{ id: 5, name: "榜单电台" }] } });
  };
  try {
    for (const type of ["hours", "popular", "newcomer", "pay"] as const) {
      assert.equal((await getPodcastAdvancedToplist(type, 5))[0]?.name, "榜单电台");
    }
    assert.deepEqual(paths, [
      "/dj/toplist/hours",
      "/dj/toplist/popular",
      "/dj/toplist/newcomer",
      "/dj/toplist/pay",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
