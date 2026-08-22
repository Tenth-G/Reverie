import test from "node:test";
import assert from "node:assert/strict";
import {
  getVipGrowth,
  getVipGrowthDetails,
  getVipTasks,
} from "../src/api/vip.ts";

test("vip APIs normalize growth, tasks and history records", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("vip/growthpoint/details"))
      return Response.json({ data: [{ id: 3, reason: "播放", growth: 8 }] });
    if (url.includes("vip/tasks"))
      return Response.json({
        data: [
          {
            id: "t1",
            taskName: "听歌",
            reward: 5,
            completed: true,
            claimed: true,
          },
        ],
      });
    return Response.json({
      data: { level: 4, growth: 80, nextLevelGrowth: 100 },
    });
  };
  try {
    const growth = await getVipGrowth();
    const tasks = await getVipTasks();
    const details = await getVipGrowthDetails();
    assert.equal(growth.level, 4);
    assert.equal(growth.progress, 0.8);
    assert.equal(tasks[0]?.completed, true);
    assert.equal(tasks[0]?.claimed, true);
    assert.equal(details[0]?.amount, 8);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
