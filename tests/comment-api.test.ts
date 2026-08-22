import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteResourceComment,
  getCommentHugList,
  getHotResourceComments,
  getCommentReplies,
  getResourceComments,
  likeResourceComment,
  normalizeResourceComment,
  hugComment,
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

test("legacy comment fallback and hug endpoints remain available", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      paths.push(url.pathname);
      if (url.pathname === "/comment/new") return Response.json({ code: 500 });
      if (url.pathname === "/comment/music") return Response.json({ comments: [{ commentId: 1, content: "旧接口", user: { userId: 2, nickname: "用户" } }] });
      if (url.pathname === "/comment/hot") return Response.json({ hotComments: [{ commentId: 2, content: "热门", user: { userId: 3, nickname: "热评" } }] });
      if (url.pathname === "/comment/hug/list") return Response.json({ data: [{ commentId: 4, content: "抱一抱", user: { userId: 4, nickname: "拥抱者" } }] });
      return Response.json({ code: 200 });
    };
    const resource = { type: "song" as const, id: "7", title: "歌曲" };
    const fallback = await getResourceComments(resource);
    const hot = await getHotResourceComments(resource);
    await hugComment(resource, fallback.comments[0]!);
    const hugs = await getCommentHugList(resource, fallback.comments[0]!);
    assert.equal(fallback.comments[0]?.content, "旧接口");
    assert.equal(hot[0]?.content, "热门");
    assert.equal(hugs[0]?.nickname, "拥抱者");
    assert.deepEqual(paths.slice(0, 2), ["/comment/new", "/comment/music"]);
    assert.ok(paths.includes("/hug/comment"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
