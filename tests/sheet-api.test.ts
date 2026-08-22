import test from "node:test";
import assert from "node:assert/strict";
import { getSongSheetPreview, getSongSheets } from "../src/api/sheet.ts";

test("sheet APIs normalize list and preview responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/sheet/list") return Response.json({ data: [{ id: "s1", name: "钢琴谱", type: "钢琴", previewUrl: "preview" }, { id: "s1", name: "重复" }] });
    return Response.json({ data: { sheet: { id: "s1", name: "钢琴谱", description: "预览" } } });
  };
  try {
    const sheets = await getSongSheets(1);
    assert.equal(sheets.length, 1);
    assert.equal(sheets[0]?.type, "钢琴");
    assert.equal((await getSongSheetPreview(1))?.description, "预览");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
