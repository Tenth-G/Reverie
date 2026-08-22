import test from "node:test";
import assert from "node:assert/strict";
import {
  decryptEapi,
  getNeteaseApiVersion,
  getNeteaseSettings,
} from "../src/api/appMeta.ts";

test("settings and version helpers normalize sidecar responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/setting") return Response.json({ data: { locale: "zh-CN" } });
    assert.equal(url.pathname, "/inner/version");
    return Response.json({ data: { version: "4.32.0" } });
  };
  try {
    assert.deepEqual(await getNeteaseSettings(), { locale: "zh-CN" });
    assert.equal(await getNeteaseApiVersion(), "4.32.0");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("eapi decrypt forwards cleaned payload and request/response mode", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/eapi/decrypt");
    assert.equal(url.searchParams.get("hexString"), "AABB");
    assert.equal(url.searchParams.get("isReq"), "false");
    return Response.json({ data: { decoded: true } });
  };
  try {
    assert.deepEqual(await decryptEapi(" AA BB ", true), { decoded: true });
    await assert.rejects(() => decryptEapi("   "), /hexString 不能为空/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
