import test from "node:test";
import assert from "node:assert/strict";
import { getArtistFans } from "../src/api/artistFans.ts";

test("artist fans API normalizes fan list and total count", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("follow/count")) return Response.json({ data: { count: 42 } });
    return Response.json({
      data: {
        list: [
          {
            userId: 7,
            nickname: "粉丝",
            avatarUrl: "avatar",
            signature: "喜欢音乐",
            followed: true,
          },
        ],
        hasMore: true,
      },
    });
  };
  try {
    const result = await getArtistFans(2116, 10, 0);
    assert.match(urls[0]!, /artist\/fans/);
    assert.match(urls[1]!, /artist\/follow\/count/);
    assert.equal(result.fans[0]?.nickname, "粉丝");
    assert.equal(result.fans[0]?.followed, true);
    assert.equal(result.total, 42);
    assert.equal(result.hasMore, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
