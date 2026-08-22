import test from "node:test";
import assert from "node:assert/strict";
import { getPrivateDjContent } from "../src/api/privateDj.ts";

test("private DJ API normalizes songs and DJ programs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/aidj/content/rcmd");
    return Response.json({
      data: [
        { song: { id: 1, name: "推荐歌曲", ar: [{ name: "歌手" }] } },
        { program: { id: 2, name: "DJ 声音", picUrl: "cover", url: "https://example.test/audio.mp3" } },
      ],
    });
  };
  try {
    const items = await getPrivateDjContent();
    assert.equal(items.length, 2);
    assert.equal(items[0]?.kind, "song");
    assert.equal(items[0]?.song?.name, "推荐歌曲");
    assert.equal(items[1]?.kind, "program");
    assert.equal(items[1]?.programId, 2);
    assert.equal(items[1]?.audioUrl, "https://example.test/audio.mp3");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
