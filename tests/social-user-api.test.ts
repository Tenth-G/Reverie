import assert from "node:assert/strict";
import test from "node:test";
import {
  getEvents,
  getMixedFollows,
  getMutualFollow,
  getUserEvents,
} from "../src/api/extended.ts";

test("getEvents normalizes activity resources and interaction counts", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/event");
      return Response.json({
        event: [
          {
            id: 9,
            eventTime: 123,
            user: { userId: 42, nickname: "测试用户", avatarUrl: "avatar" },
            json: JSON.stringify({ msg: "分享歌曲", song: { id: 7, name: "歌曲" } }),
            info: { commentCount: 2, likedCount: 3, liked: true, threadId: "t-1" },
            forwardCount: 4,
          },
        ],
      });
    };
    const [event] = await getEvents();
    assert.equal(event?.text, "分享歌曲");
    assert.equal(event?.resourceType, "song");
    assert.equal(event?.resourceId, 7);
    assert.equal(event?.likedCount, 3);
    assert.equal(event?.threadId, "t-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getUserEvents requests the selected user activity feed", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/user/event");
      assert.equal(url.searchParams.get("uid"), "42");
      assert.equal(url.searchParams.get("lasttime"), "100");
      assert.equal(url.searchParams.get("limit"), "12");
      return Response.json({ events: [{ id: 1, user: { userId: 42 }, json: "{}" }] });
    };
    const events = await getUserEvents(42, 100, 12);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.id, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getMixedFollows normalizes the selected follow scene and cursor", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/user/follow/mixed");
      assert.equal(url.searchParams.get("scene"), "2");
      assert.equal(url.searchParams.get("size"), "20");
      assert.equal(url.searchParams.get("cursor"), "5");
      return Response.json({ data: { users: [{ userId: 8, nickname: "关注用户" }], cursor: 9, more: true } });
    };
    const result = await getMixedFollows(2, 20, 5);
    assert.equal(result.users[0]?.userId, 8);
    assert.equal(result.cursor, 9);
    assert.equal(result.more, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getMutualFollow reads the relationship flag", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, "/user/mutualfollow/get");
      assert.equal(url.searchParams.get("uid"), "8");
      return Response.json({ data: { mutual: true } });
    };
    assert.equal(await getMutualFollow(8), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
