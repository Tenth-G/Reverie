import test from "node:test";
import assert from "node:assert/strict";
import { dislikeRecommendSong } from "../src/api/client.ts";

test("daily recommendation dislike sends the song id as a mutation", async () => {
  const originalFetch = globalThis.fetch;
  let captured = "";
  globalThis.fetch = async (input, init) => {
    captured = `${String(input)} ${init?.method ?? "GET"}`;
    return Response.json({ code: 200 });
  };
  try {
    await dislikeRecommendSong(123);
    assert.match(captured, /\/recommend\/songs\/dislike/);
    assert.match(captured, /id=123/);
    assert.match(captured, /POST/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
