import test from "node:test";
import assert from "node:assert/strict";
import { logoutFromNetease } from "../src/api/auth.ts";

test("logoutFromNetease calls the server logout endpoint", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/logout");
    return Response.json({ code: 200 });
  };
  try {
    await logoutFromNetease();
  } finally {
    globalThis.fetch = originalFetch;
  }
});
