import assert from "node:assert/strict";
import test from "node:test";
import { matchAudioFingerprint } from "../src/api/audioMatch.ts";

test("audio match forwards fingerprint and duration and normalizes songs", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/audio/match");
      assert.equal(url.searchParams.get("audioFP"), "fp-data");
      assert.equal(url.searchParams.get("duration"), "120000");
      return Response.json({ data: { result: [{ song: { id: 4, name: "匹配歌曲", ar: [{ name: "歌手" }], al: { name: "专辑" } } }] } });
    };
    const songs = await matchAudioFingerprint("fp-data", 120000);
    assert.equal(songs[0]?.name, "匹配歌曲");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
