import test from "node:test";
import assert from "node:assert/strict";
import {
  dailySignIn,
  finishYunbeiTask,
  getYunbeiLedger,
  getYunbeiOverview,
  getYunbeiTasks,
} from "../src/api/yunbei.ts";

test("yunbei overview combines balance, daily points and sign state", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/yunbei/info"))
      return Response.json({ data: { point: 88 } });
    if (url.includes("/yunbei/today"))
      return Response.json({
        data: { point: 6, isSigned: true, continuousDays: 4 },
      });
    return Response.json({ data: { balance: 120 } });
  };
  try {
    const overview = await getYunbeiOverview();
    assert.deepEqual(overview, {
      balance: 120,
      todayEarned: 6,
      signed: true,
      signDays: 4,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("yunbei tasks, sign-in and ledger use their dedicated routes", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.includes("/yunbei/tasks"))
      return Response.json({
        data: [{ id: 1, name: "签到", point: 5, status: "done" }],
      });
    if (url.includes("/yunbei/receipt"))
      return Response.json({ data: [{ id: 2, reason: "任务", point: 5 }] });
    return Response.json({ code: 200 });
  };
  try {
    const tasks = await getYunbeiTasks();
    await dailySignIn(1);
    await finishYunbeiTask(1, "0");
    const ledger = await getYunbeiLedger("income");
    assert.equal(tasks[0]?.status, "done");
    assert.equal(ledger[0]?.amount, 5);
    assert.match(urls[0]!, /\/yunbei\/tasks/);
    assert.match(urls[1]!, /\/daily_signin/);
    assert.match(urls[2]!, /\/yunbei\/task\/finish/);
    assert.match(urls[3]!, /\/yunbei\/receipt/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
