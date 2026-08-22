import test from "node:test";
import assert from "node:assert/strict";
import { getCalendar } from "../src/api/calendar.ts";

test("calendar API normalizes events and forwards the date range", async () => {
  const originalFetch = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (input) => {
    requested = String(input);
    return Response.json({
      data: [
        {
          id: "event-2",
          title: "晚间活动",
          startTime: 2000,
          endTime: 3000,
          tag: "活动",
          resourceId: 8,
          resourceType: "song",
        },
        {
          id: "event-1",
          name: "新歌上线",
          publishTime: 1000,
          picUrl: "https://example.test/cover.jpg",
        },
      ],
    });
  };
  try {
    const events = await getCalendar(10, 20);
    assert.match(requested, /calendar/);
    assert.match(requested, /startTime=10/);
    assert.match(requested, /endTime=20/);
    assert.equal(events.length, 2);
    assert.equal(events[0]?.title, "新歌上线");
    assert.equal(events[1]?.category, "活动");
    assert.equal(events[1]?.resourceId, 8);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
