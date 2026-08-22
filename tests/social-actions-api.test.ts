import test from "node:test";
import assert from "node:assert/strict";
import { likeEvent } from "../src/api/extended.ts";

test("event like mutation forwards event thread and toggle", async () => {
  const originalFetch = globalThis.fetch;
  let captured = "";
  globalThis.fetch = async (input) => {
    captured = String(input);
    return Response.json({ code: 200 });
  };
  try {
    await likeEvent(9, "A_EV_2_thread", true);
    assert.match(captured, /\/resource\/like/);
    assert.match(captured, /threadId=A_EV_2_thread/);
    assert.match(captured, /t=1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
