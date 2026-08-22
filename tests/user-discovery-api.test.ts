import test from "node:test";
import assert from "node:assert/strict";
import { getSimilarUsers, getUserIds } from "../src/api/userDiscovery.ts";

test("user id lookup forwards comma-separated nicknames", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/get/userids");
    assert.equal(url.searchParams.get("nicknames"), "甲,乙");
    return Response.json({ data: [{ nickname: "甲", userId: 10 }, { nickname: "乙", id: 11 }] });
  };
  try {
    assert.deepEqual(await getUserIds([" 甲 ", "乙"]), [
      { nickname: "甲", userId: 10 },
      { nickname: "乙", userId: 11 },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("similar users normalize profile fields and pagination", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/simi/user");
    assert.equal(url.searchParams.get("id"), "8");
    assert.equal(url.searchParams.get("limit"), "2");
    assert.equal(url.searchParams.get("offset"), "4");
    return Response.json({ data: { users: [{ userId: 3, nickname: "相似用户", avatarUrl: "a" }] } });
  };
  try {
    assert.deepEqual(await getSimilarUsers(8, 2, 4), [
      {
        userId: 3,
        nickname: "相似用户",
        avatarUrl: "a",
        signature: "",
        followed: false,
        follows: 0,
        followeds: 0,
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
