import test from "node:test";
import assert from "node:assert/strict";
import {
  getRecommendHistory,
  getRecommendHistoryDetail,
} from "../src/api/recommendHistory.ts";

test("recommend history maps dates and daily songs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("history/recommend/songs/detail"))
      return Response.json({
        data: {
          dailySongs: [
            {
              id: 1,
              name: "历史歌曲",
              ar: [{ name: "歌手" }],
              al: { name: "专辑" },
            },
          ],
        },
      });
    return Response.json({
      data: [{ date: "2026-08-20", displayDate: "8月20日", songCount: 10 }],
    });
  };
  try {
    const days = await getRecommendHistory();
    const songs = await getRecommendHistoryDetail(days[0]!.date);
    assert.equal(days[0]?.displayDate, "8月20日");
    assert.equal(songs[0]?.name, "历史歌曲");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
