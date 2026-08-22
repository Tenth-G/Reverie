import test from "node:test";
import assert from "node:assert/strict";
import {
  getCreatorAuthInfo,
  getFansDemographics,
  getFansOverview,
  getFansTrend,
} from "../src/api/fans.ts";
test("fans APIs normalize auth, overview, trend and demographics", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("authinfo"))
      return Response.json({ data: { authenticated: true, name: "达人" } });
    if (url.includes("overview"))
      return Response.json({ data: { fanCount: 8, todayAdded: 2 } });
    if (url.includes("trend"))
      return Response.json({ data: [{ date: "2026-08-22", count: 3 }] });
    return Response.json({ data: [{ name: "18-24", value: 4 }] });
  };
  try {
    assert.equal((await getCreatorAuthInfo()).authenticated, true);
    assert.equal((await getFansOverview()).total, 8);
    assert.equal((await getFansTrend())[0]?.count, 3);
    assert.equal((await getFansDemographics("age"))[0]?.label, "18-24");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
