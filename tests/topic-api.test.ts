import test from "node:test";
import assert from "node:assert/strict";
import { getHotTopics, getSubscribedTopics, getTopicDetail, getTopicHotEvents } from "../src/api/topic.ts";

test("topic APIs normalize hot, subscribed, detail and event data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/hot/topic") return Response.json({ data: [{ actId: 1, title: "热门话题", coverUrl: "cover", participateCount: 8 }] });
    if (path === "/topic/sublist") return Response.json({ data: [{ topicId: 2, name: "收藏话题" }] });
    if (path === "/topic/detail") return Response.json({ data: { actId: 1, title: "详情", desc: "介绍" } });
    return Response.json({ events: [{ id: "e1", content: "动态", user: { nickname: "用户" }, likedCount: 3 }] });
  };
  try {
    assert.equal((await getHotTopics())[0]?.title, "热门话题");
    assert.equal((await getSubscribedTopics())[0]?.id, 2);
    assert.equal((await getTopicDetail(1)).description, "介绍");
    assert.equal((await getTopicHotEvents(1))[0]?.creatorName, "用户");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
