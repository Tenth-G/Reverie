import test from "node:test";
import assert from "node:assert/strict";
import { getSongMetadata } from "../src/api/songMetadata.ts";

test("song metadata combines wiki, creators and chorus responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("song/wiki/summary"))
      return Response.json({ data: { summary: "歌曲百科" } });
    if (url.includes("song/creators"))
      return Response.json({
        creators: [{ userId: 2, name: "创作者", role: "作词" }],
      });
    return Response.json({ data: [{ start: 1000, end: 5000 }] });
  };
  try {
    const metadata = await getSongMetadata(1);
    assert.equal(metadata.summary, "歌曲百科");
    assert.equal(metadata.creators[0]?.role, "作词");
    assert.equal(metadata.chorus[0]?.end, 5000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
