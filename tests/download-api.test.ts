import test from "node:test";
import assert from "node:assert/strict";
import { getSongDownloadUrl } from "../src/api/client.ts";

test("download URL helper uses the v1 download endpoint and level", async () => {
  const originalFetch = globalThis.fetch;
  let captured = "";
  globalThis.fetch = async (input) => {
    captured = String(input);
    return Response.json({ data: { url: "https://download", br: 320000 } });
  };
  try {
    const result = await getSongDownloadUrl(123, "lossless");
    assert.equal(result.url, "https://download");
    assert.equal(result.br, 320000);
    assert.match(captured, /\/song\/download\/url\/v1/);
    assert.match(captured, /id=123/);
    assert.match(captured, /level=lossless/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
