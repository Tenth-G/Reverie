import test from "node:test";
import assert from "node:assert/strict";
import { getCollection, subscribeCollection } from "../src/api/collection.ts";

test("getCollection maps collection list response shapes", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.includes("/album/sublist"))
      return Response.json({
        data: [{ id: 1, name: "专辑", artist: { id: 2, name: "歌手" } }],
        count: 1,
      });
    if (url.includes("/artist/sublist"))
      return Response.json({
        data: [{ id: 2, name: "歌手", img1v1Url: "a" }],
        count: 1,
      });
    if (url.includes("/mv/sublist"))
      return Response.json({
        data: [
          {
            vid: "3",
            title: "MV",
            creator: [{ userName: "视频作者" }],
          },
        ],
        count: 1,
      });
    return Response.json({
      djRadios: [{ id: 4, name: "播客", dj: { nickname: "主播" } }],
      count: 1,
    });
  };
  try {
    assert.equal(
      (await getCollection("albums")).albums[0]?.artistNames,
      "歌手",
    );
    assert.equal((await getCollection("artists")).artists[0]?.name, "歌手");
    const mv = (await getCollection("mvs")).media[0];
    assert.equal(mv?.kind, "mv");
    assert.equal(mv?.creatorName, "视频作者");
    assert.equal((await getCollection("radios")).radios[0]?.djName, "主播");
    assert.equal(requests.length, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("subscribeCollection forwards category-specific parameters", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return Response.json({ code: 200 });
  };
  try {
    await subscribeCollection("albums", 1, false);
    await subscribeCollection("artists", 2, false);
    await subscribeCollection("mvs", 3, false);
    await subscribeCollection("radios", 4, false);
    assert.match(requests[0], /album\/sub/);
    assert.match(requests[0], /id=1/);
    assert.match(requests[1], /artist\/sub/);
    assert.match(requests[1], /id=2/);
    assert.match(requests[2], /mv\/sub/);
    assert.match(requests[2], /mvid=3/);
    assert.match(requests[3], /dj\/sub/);
    assert.match(requests[3], /rid=4/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
