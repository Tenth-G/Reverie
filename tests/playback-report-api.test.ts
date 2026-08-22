import test from "node:test";
import assert from "node:assert/strict";
import { reportScrobble, reportWeblog } from "../src/api/playbackReport.ts";

test("playback reports send normalized scrobble and weblog payloads", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ path: string; url: URL }> = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    calls.push({ path: url.pathname, url });
    return Response.json({ code: 200 });
  };
  try {
    await reportScrobble({ id: 12, sourceId: 34, time: 61.8 });
    await reportWeblog({ id: 12, sourceId: 34, time: 61.8, source: "fm" });
    assert.equal(calls[0]?.path, "/scrobble");
    assert.equal(calls[0]?.url.searchParams.get("id"), "12");
    assert.equal(calls[0]?.url.searchParams.get("sourceid"), "34");
    assert.equal(calls[0]?.url.searchParams.get("time"), "61");
    assert.equal(calls[1]?.path, "/weblog");
    const data = JSON.parse(calls[1]!.url.searchParams.get("data")!);
    assert.equal(data.action, "play");
    assert.equal(data.json.id, 12);
    assert.equal(data.json.source, "fm");
    assert.equal(data.json.time, 61);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("playback reports ignore invalid song ids", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({ code: 200 });
  };
  try {
    await reportScrobble({ id: 0 });
    await reportWeblog({ id: -1 });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
