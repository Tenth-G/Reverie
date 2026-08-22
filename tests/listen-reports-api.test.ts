import test from "node:test";
import assert from "node:assert/strict";
import {
  getAnnualSummary,
  getListenRealtime,
  getListenReport,
  getListenTodaySongs,
  getListenTotal,
  getListenYearReport,
  getListenTimeMachine,
} from "../src/api/listenReports.ts";

test("listen report APIs normalize totals, reports, songs and time machine", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("total"))
      return Response.json({
        data: { duration: 60000, songCount: 4, playCount: 8 },
      });
    if (url.includes("today"))
      return Response.json({
        data: [{ id: 2, name: "今日歌曲", playCount: 3 }],
      });
    if (url.includes("timemachine"))
      return Response.json({
        data: [{ date: "2026-08-22", songName: "时光机", count: 2 }],
      });
    return Response.json({
      data: { duration: 120000, songCount: 5, playCount: 9 },
    });
  };
  try {
    assert.equal((await getListenTotal()).songCount, 4);
    assert.equal((await getListenRealtime()).playCount, 9);
    assert.equal((await getListenReport("year")).duration, 120000);
    assert.equal((await getListenTodaySongs())[0]?.count, 3);
    assert.equal((await getListenYearReport()) !== undefined, true);
    assert.equal((await getAnnualSummary(2025)) !== undefined, true);
    assert.equal((await getListenTimeMachine())[0]?.songName, "时光机");
    assert.match(urls[0]!, /listen\/data\/total/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
