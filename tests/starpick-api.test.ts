import assert from "node:assert/strict";
import test from "node:test";
import { getStarpickCommentsSummary } from "../src/api/starpick.ts";

test("starpick comment summary extracts nested hot comments", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/starpick/comments/summary");
      return Response.json({ blocks: [{ extInfo: { comments: [{ commentId: 1, content: "好听", likedCount: 9, user: { userId: 2, nickname: "评论者" } }] } }] });
    };
    const comments = await getStarpickCommentsSummary();
    assert.equal(comments[0]?.content, "好听");
    assert.equal(comments[0]?.nickname, "评论者");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
