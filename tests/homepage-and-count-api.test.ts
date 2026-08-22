import test from "node:test";
import assert from "node:assert/strict";
import { getHomepageBlockPage, getHomepageDragonBall } from "../src/api/homepage.ts";
import { getNotificationCounts } from "../src/api/notification.ts";

test("homepage APIs normalize dragon-ball entries and blocks", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/homepage/dragon/ball") {
      return Response.json({ data: [{ id: 1, name: "每日推荐", iconUrl: "i" }] });
    }
    assert.equal(url.pathname, "/homepage/block/page");
    assert.equal(url.searchParams.get("refresh"), "true");
    return Response.json({ data: { cursor: "next", hasMore: true, blocks: [{ blockCode: "rcmd", title: "推荐" }] } });
  };
  try {
    assert.deepEqual(await getHomepageDragonBall(), [{ id: "1", name: "每日推荐", iconUrl: "i", target: "" }]);
    assert.deepEqual(await getHomepageBlockPage(true), {
      cursor: "next",
      hasMore: true,
      blocks: [{ code: "rcmd", title: "推荐", data: { blockCode: "rcmd", title: "推荐" } }],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("notification counts normalize the pl count response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/pl/count");
    return Response.json({ private: 2, comment: 3, forward: 4, notice: 1 });
  };
  try {
    assert.deepEqual(await getNotificationCounts(), {
      private: 2,
      comments: 3,
      forwards: 4,
      notices: 1,
      total: 10,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
