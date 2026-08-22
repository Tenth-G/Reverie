import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteResourceComment,
  getCommentReplies,
  getResourceComments,
  likeResourceComment,
  normalizeResourceComment,
  sendResourceComment,
} from "../src/api/comment.ts";

test("resource comments normalize user, reply count and ownership fields", () => {
  const comment = normalizeResourceComment({
    commentId: 12,
    content: "内容",
    time: 100,
    liked: true,
    likedCount: 8,
    replyCount: 3,
    owner: true,
    user: { userId: 2, nickname: "评论者", avatarUrl: "avatar" },
    beReplied: [
      {
        content: "原评论",
        user: { userId: 3, nickname: "原作者" },
      },
    ],
  });
  assert.deepEqual(comment, {
    id: 12,
    content: "内容",
    time: 100,
    liked: true,
    likedCount: 8,
    replyCount: 3,
    owner: true,
    userId: 2,
    nickname: "评论者",
    avatarUrl: "avatar",
    repliedTo: { userId: 3, nickname: "原作者", content: "原评论" },
  });
});

test("resource comments preserve cursor pagination and sort parameters", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    return Response.json({
      code: 200,
      data: {
        comments: [
          {
            commentId: 1,
            content: "最新",
            time: 10,
            user: { userId: 2, nickname: "用户" },
          },
        ],
        totalCount: 20,
        hasMore: true,
        cursor: "cursor-2",
      },
    });
  };
  try {
    const result = await getResourceComments(
      {
        type: "album",
        id: "88",
        title: "专辑",
      },
      2,
      "new",
      "cursor-1",
    );
    const url = new URL(urls[0]!);
    assert.equal(url.pathname, "/comment/new");
    assert.equal(url.searchParams.get("id"), "88");
    assert.equal(url.searchParams.get("type"), "3");
    assert.equal(url.searchParams.get("pageNo"), "2");
    assert.equal(url.searchParams.get("sortType"), "3");
    assert.equal(url.searchParams.get("cursor"), "cursor-1");
    assert.equal(result.cursor, "cursor-2");
    assert.equal(result.comments[0]?.content, "最新");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("comment floor and mutations use the resource thread", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    urls.push(String(input));
    if (urls.length === 1) {
      return Response.json({
        code: 200,
        data: {
          comments: [
            {
              commentId: 4,
              content: "回复",
              user: { userId: 2, nickname: "用户" },
            },
          ],
          hasMore: true,
          time: 40,
        },
      });
    }
    return Response.json({ code: 200 });
  };
  try {
    const resource = { type: "playlist" as const, id: "99", title: "歌单" };
    const floor = await getCommentReplies(resource, 3, 20);
    await sendResourceComment(resource, "评论");
    await sendResourceComment(resource, "回复", 3);
    await likeResourceComment(resource, 3, true);
    await deleteResourceComment(resource, 3);
    assert.equal(floor.comments[0]?.id, 4);
    const paths = urls.map((url) => new URL(url).pathname);
    assert.deepEqual(paths, [
      "/comment/floor",
      "/comment",
      "/comment",
      "/comment/like",
      "/comment",
    ]);
    assert.equal(new URL(urls[0]!).searchParams.get("threadId"), null);
    assert.equal(new URL(urls[1]!).searchParams.get("type"), "2");
    assert.equal(new URL(urls[2]!).searchParams.get("t"), "2");
    assert.equal(new URL(urls[3]!).searchParams.get("t"), "1");
    assert.equal(new URL(urls[4]!).searchParams.get("t"), "0");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
