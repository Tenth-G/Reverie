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
    if (url.includes("song/music/detail"))
      return Response.json({ data: { level: "exhigh", bitrate: 320000, format: "mp3", size: 12345 } });
    if (url.includes("song/red/count"))
      return Response.json({ data: { count: 88 } });
    return Response.json({ data: [{ start: 1000, end: 5000 }] });
  };
  try {
    const metadata = await getSongMetadata(1);
    assert.equal(metadata.summary, "歌曲百科");
    assert.equal(metadata.creators[0]?.role, "作词");
    assert.equal(metadata.chorus[0]?.end, 5000);
    assert.equal(metadata.musicDetail?.bitrate, 320000);
    assert.equal(metadata.redCount, 88);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
