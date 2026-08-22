import test from "node:test";
import assert from "node:assert/strict";
import { claimVipTaskRewards, getVipGrowthpointInfo } from "../src/api/vip.ts";
import {
  getYunbeiRecommendationHistory,
  submitYunbeiRecommendation,
} from "../src/api/yunbei.ts";

test("VIP and Yunbei action wrappers forward expected params", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    calls.push(String(input));
    return Response.json({ data: { list: [] } });
  };
  try {
    await getVipGrowthpointInfo();
    await claimVipTaskRewards(["a", "b"]);
    await submitYunbeiRecommendation({
      songId: 4,
      reason: "推荐",
      yunbeiNum: 12,
    });
    await getYunbeiRecommendationHistory(10, "cursor");
    assert.match(calls[0]!, /vip\/growthpoint(?!\w)/);
    assert.match(calls[1]!, /vip\/growthpoint\/get\?ids=a%2Cb/);
    assert.match(
      calls[2]!,
      /yunbei\/rcmd\/song\?id=4&reason=%E6%8E%A8%E8%8D%90&yunbeiNum=12/,
    );
    assert.match(
      calls[3]!,
      /yunbei\/rcmd\/song\/history\?size=10&cursor=cursor/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
