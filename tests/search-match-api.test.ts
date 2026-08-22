import assert from "node:assert/strict";
import test from "node:test";
import { getSearchMultimatch, matchLocalSong } from "../src/api/search.ts";

test("search multimatch and local match normalize endpoint results", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/search/multimatch") {
        assert.equal(url.searchParams.get("keywords"), "海阔天空");
        return Response.json({ result: { artists: [{ name: "Beyond", type: "歌手" }] } });
      }
      assert.equal(url.pathname, "/search/match");
      assert.equal(url.searchParams.get("title"), "海阔天空");
      return Response.json({ result: { songs: [{ id: 15, name: "海阔天空", ar: [{ name: "Beyond" }], al: { name: "专辑" } }] } });
    };
    assert.equal((await getSearchMultimatch("海阔天空"))[0]?.keyword, "Beyond");
    assert.equal((await matchLocalSong({ title: "海阔天空" }))[0]?.id, 15);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
