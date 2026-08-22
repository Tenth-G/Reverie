import test from "node:test";
import assert from "node:assert/strict";
import {
  getRecentAlbums,
  getRecentCategory,
  getRecentSongs,
} from "../src/api/recent.ts";

test("recent song records normalize nested song shapes", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      data: [
        {
          song: {
            id: 1,
            name: "最近",
            ar: [{ name: "歌手" }],
            al: { name: "专辑" },
          },
        },
      ],
    });
  try {
    const songs = await getRecentSongs(10);
    assert.equal(songs[0]?.name, "最近");
    assert.equal(songs[0]?.artists, "歌手");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recent categories map endpoint-specific routes", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    if (String(input).includes("record/recent/album"))
      return Response.json({ data: [{ album: { id: 2, name: "专辑" } }] });
    return Response.json({ data: [] });
  };
  try {
    const result = await getRecentCategory("albums");
    assert.equal(result.albums[0]?.name, "专辑");
    assert.match(urls[0]!, /record\/recent\/album/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
