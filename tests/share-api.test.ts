import test from "node:test";
import assert from "node:assert/strict";
import { shareResource } from "../src/api/share.ts";

test("share resource forwards type, id and optional message", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/share/resource");
    assert.equal(url.searchParams.get("type"), "song");
    assert.equal(url.searchParams.get("id"), "7");
    assert.equal(url.searchParams.get("msg"), "分享一下");
    return Response.json({ code: 200 });
  };
  try {
    await shareResource("song", 7, "  分享一下 ");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
