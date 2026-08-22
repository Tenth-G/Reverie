import assert from "node:assert/strict";
import test from "node:test";
import { getListeningRecords, getProfileCenter } from "../src/api/profile.ts";

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("getProfileCenter combines detail, level, subcount and records", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === "/user/detail") {
        return json({
          level: 7,
          listenSongs: 1234,
          createTime: 1000,
          profile: {
            userId: 42,
            nickname: "测试用户",
            avatarUrl: "avatar.jpg",
            backgroundUrl: "background.jpg",
            signature: "签名",
            follows: 8,
            followeds: 9,
            playlistCount: 10,
            eventCount: 11,
          },
        });
      }
      if (path === "/user/level") {
        return json({
          data: {
            level: 7,
            progress: 0.5,
            nowPlayCount: 100,
            nextPlayCount: 200,
            nowLoginCount: 20,
            nextLoginCount: 30,
          },
        });
      }
      if (path === "/user/subcount") {
        return json({
          artistCount: 3,
          albumCount: 4,
          mvCount: 5,
          djRadioCount: 6,
          createdPlaylistCount: 7,
          subPlaylistCount: 8,
        });
      }
      return json({
        weekData: [
          {
            playCount: 12,
            score: 99,
            song: {
              id: 1,
              name: "歌曲",
              ar: [{ id: 2, name: "歌手" }],
              al: { id: 3, name: "专辑", picUrl: "cover.jpg" },
              dt: 1000,
            },
          },
        ],
      });
    }) as typeof fetch;

    const result = await getProfileCenter(42);
    assert.equal(result.detail.nickname, "测试用户");
    assert.equal(result.detail.listenSongs, 1234);
    assert.equal(result.level.progress, 0.5);
    assert.equal(result.subcount.albumCount, 4);
    assert.equal(result.records[0].song.name, "歌曲");
    assert.equal(result.records[0].playCount, 12);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getListeningRecords selects weekly and all-time response fields", async () => {
  const originalFetch = globalThis.fetch;
  const requestedTypes: string[] = [];
  try {
    globalThis.fetch = (async (input) => {
      const url = new URL(String(input));
      requestedTypes.push(url.searchParams.get("type") ?? "");
      const song = {
        id: 7,
        name: "记录歌曲",
        ar: [{ name: "歌手" }],
        al: { id: 8, name: "专辑" },
      };
      return json({
        weekData: [{ song, playCount: 2, score: 20 }],
        allData: [{ song, playCount: 9, score: 90 }],
      });
    }) as typeof fetch;

    assert.equal((await getListeningRecords(1, "week"))[0].playCount, 2);
    assert.equal((await getListeningRecords(1, "all"))[0].playCount, 9);
    assert.deepEqual(requestedTypes, ["1", "0"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
