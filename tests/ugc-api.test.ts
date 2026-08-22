import test from "node:test";
import assert from "node:assert/strict";
import {
  getUgcAlbum,
  getUgcArtist,
  getUgcContributions,
  getUgcDevote,
  getUgcMv,
  getUgcSong,
  searchUgcArtists,
} from "../src/api/ugc.ts";

test("UGC APIs normalize resource, search and contribution records", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("artist/search"))
      return Response.json({ data: [{ id: 4, name: "歌手" }] });
    if (url.includes("detail"))
      return Response.json({
        data: [{ id: "c1", title: "贡献", status: "PASS" }],
      });
    if (url.includes("devote"))
      return Response.json({ data: { count: 2, points: 8, yunbei: 3 } });
    return Response.json({
      data: { id: 1, name: "百科资源", description: "说明" },
    });
  };
  try {
    assert.equal((await getUgcSong(1)).kind, "song");
    assert.equal((await getUgcAlbum(1)).kind, "album");
    assert.equal((await getUgcArtist(1)).kind, "artist");
    assert.equal((await getUgcMv(1)).kind, "mv");
    assert.equal((await searchUgcArtists("歌"))[0]?.name, "歌手");
    assert.equal((await getUgcContributions())[0]?.status, "PASS");
    assert.equal((await getUgcDevote()).yunbei, 3);
    assert.match(urls[0]!, /ugc\/song\/get/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
