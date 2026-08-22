import assert from "node:assert/strict";
import test from "node:test";
import { executeBatch } from "../src/api/batch.ts";

test("batch API posts multiple serialized sub-requests", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/batch");
      assert.equal(init?.method, "POST");
      assert.equal(url.searchParams.get("/api/playlist/name/update"), '{"id":7,"name":"新歌单"}');
      return Response.json({ code: 200, data: { ok: true } });
    };
    const result = await executeBatch({
      "/api/playlist/name/update": '{"id":7,"name":"新歌单"}',
      "/api/playlist/desc/update": '{"id":7,"desc":"描述"}',
    });
    assert.equal((result as { code?: number }).code, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
