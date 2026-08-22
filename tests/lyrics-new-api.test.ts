import test from "node:test";
import assert from "node:assert/strict";
import { getLyric } from "../src/api/client.ts";

test("getLyric prefers the modern逐字 lyric route and forwards its options", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(url.toString());
    assert.equal(url.pathname, "/lyric/new");
    assert.equal(url.searchParams.get("id"), "42");
    assert.equal(url.searchParams.get("cp"), "false");
    assert.equal(url.searchParams.get("ytv"), "0");
    return Response.json({
      lrc: { lyric: "[00:01.00]新版歌词" },
      tlyric: { lyric: "[00:01.00]translation" },
      yrc: { lyric: "[00:01.00]逐字歌词" },
    });
  };
  try {
    assert.deepEqual(await getLyric(42), {
      lrc: "[00:01.00]新版歌词",
      tlyric: "[00:01.00]translation",
      nolyric: false,
    });
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getLyric falls back to the legacy route when the modern route fails", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    paths.push(url.pathname);
    if (url.pathname === "/lyric/new") {
      return Response.json({ code: 404 });
    }
    assert.equal(url.pathname, "/lyric");
    return Response.json({ lrc: { lyric: "[00:02.00]旧歌词" } });
  };
  try {
    assert.deepEqual(await getLyric(7), {
      lrc: "[00:02.00]旧歌词",
      tlyric: "",
      nolyric: false,
    });
    assert.deepEqual(paths, ["/lyric/new", "/lyric"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
