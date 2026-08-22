import test from "node:test";
import assert from "node:assert/strict";
import { getArtist } from "../src/api/extended.ts";

test("artist detail includes related video records", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("artist/video"))
      return Response.json({
        data: { videos: [{ id: "v1", name: "现场", coverUrl: "cover" }] },
      });
    if (url.includes("artist/album")) return Response.json({ hotAlbums: [] });
    if (url.includes("artist/detail"))
      return Response.json({ data: { artist: { id: 1, name: "歌手" } } });
    return Response.json({ artist: { id: 1, name: "歌手" }, hotSongs: [] });
  };
  try {
    const result = await getArtist(1);
    assert.equal(result.videos[0]?.id, "v1");
    assert.match(
      urls.find((url) => url.includes("artist/video"))!,
      /artist\/video/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
