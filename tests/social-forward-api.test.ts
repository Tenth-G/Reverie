import test from "node:test";
import assert from "node:assert/strict";
import { forwardEvent } from "../src/api/extended.ts";

test("event forwarding sends event id, user id and text", async () => {
  const originalFetch = globalThis.fetch;
  let captured = "";
  globalThis.fetch = async (input) => {
    captured = String(input);
    return Response.json({ code: 200 });
  };
  try {
    await forwardEvent(8, 9, "推荐给你");
    assert.match(captured, /\/event\/forward/);
    assert.match(captured, /evId=8/);
    assert.match(captured, /uid=9/);
    assert.match(captured, /forwards=/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
