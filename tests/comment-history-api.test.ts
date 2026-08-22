import test from "node:test";
import assert from "node:assert/strict";
import { getUserCommentHistory } from "../src/api/commentHistory.ts";

test("user comment history normalizes comment and resource fields", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      data: [
        {
          id: 1,
          content: "我的评论",
          time: 100,
          resource: { id: 2, name: "歌曲" },
        },
      ],
    });
  try {
    const items = await getUserCommentHistory(9);
    assert.equal(items[0]?.content, "我的评论");
    assert.equal(items[0]?.resourceTitle, "歌曲");
    assert.equal(items[0]?.resourceId, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
