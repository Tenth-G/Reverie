import test from "node:test";
import assert from "node:assert/strict";
import { getAccountOverview } from "../src/api/account.ts";

test("account overview combines read-only account, detail and binding data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/user/account") return Response.json({ account: { id: 7, type: 1, email: "a@example.com" } });
    if (path === "/user/detail/new") return Response.json({ profile: { nickname: "用户", level: 8, vipType: 1 } });
    return Response.json({ bindings: { phone: "13812345678", weibo: "yes" } });
  };
  try {
    const overview = await getAccountOverview();
    assert.equal(overview.userId, 7);
    assert.equal(overview.phone, "138****5678");
    assert.equal(overview.vipType, 1);
    assert.deepEqual(overview.bindings, ["phone", "weibo"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
