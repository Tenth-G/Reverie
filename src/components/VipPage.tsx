import { useEffect } from "react";
import { Check, Crown, Gift, History, RefreshCw, Sparkles } from "lucide-react";
import { useVipStore } from "../store/vipStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";

function formatTime(value: number) {
  if (!value) return "时间未知";
  return new Date(value < 1e12 ? value * 1000 : value).toLocaleString("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function VipPage() {
  const growth = useVipStore((state) => state.growth);
  const tasks = useVipStore((state) => state.tasks);
  const details = useVipStore((state) => state.details);
  const timeMachine = useVipStore((state) => state.timeMachine);
  const loading = useVipStore((state) => state.loading);
  const claiming = useVipStore((state) => state.claiming);
  const load = useVipStore((state) => state.load);
  const claimRewards = useVipStore((state) => state.claimRewards);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader
        title="会员中心"
        subtitle="会员成长、任务与黑胶时光机"
        actions={
          <button
            className="btn"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> 刷新
          </button>
        }
      />
      {loading && !growth ? (
        <LoadingState label="正在加载会员信息…" />
      ) : growth ? (
        <>
          <section className="vip-overview">
            <div className="vip-level-mark">
              <Crown size={24} />
              <span>Lv.{growth.level || 0}</span>
            </div>
            <div className="vip-growth-copy">
              <strong>{growth.growth.toLocaleString()} 成长值</strong>
              <span>
                距离下一等级{" "}
                {Math.max(
                  0,
                  growth.nextLevelGrowth - growth.growth,
                ).toLocaleString()}
              </span>
              <div className="vip-progress">
                <i style={{ width: `${Math.round(growth.progress * 100)}%` }} />
              </div>
            </div>
          </section>
          <section className="vip-section">
            <div className="list-header">
              <h3>会员任务</h3>
              <span className="count">完成任务获得成长值</span>
            </div>
            {tasks.length ? (
              <div className="vip-task-list">
                {tasks.map((task) => (
                  <div className="vip-task" key={task.id}>
                    <div>
                      <strong>{task.name}</strong>
                      <span>{task.description || "完成会员任务"}</span>
                    </div>
                    <b>+{task.reward}</b>
                    {task.completed && !task.claimed ? (
                      <button
                        className="btn primary vip-task-claim"
                        onClick={() => void claimRewards([task.id])}
                        disabled={claiming}
                      >
                        <Gift size={13} />
                        {claiming ? "领取中…" : "领取"}
                      </button>
                    ) : (
                      <span
                        className={`vip-task-status ${task.completed ? "done" : ""}`}
                      >
                        {task.claimed ? (
                          <>
                            <Check size={12} /> 已领取
                          </>
                        ) : (
                          "进行中"
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">暂无会员任务</div>
            )}
          </section>
          <section className="vip-section">
            <div className="list-header">
              <h3>成长记录</h3>
              <History size={16} />
            </div>
            {details.length ? (
              <div className="vip-detail-list">
                {details.map((entry) => (
                  <div key={entry.id}>
                    <span>{entry.title}</span>
                    <time>{formatTime(entry.time)}</time>
                    <strong>+{entry.amount}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">暂无成长记录</div>
            )}
          </section>
          {timeMachine && (
            <section className="vip-section vip-time-machine">
              <div>
                <Sparkles size={18} />
                <strong>黑胶时光机</strong>
              </div>
              <pre>{JSON.stringify(timeMachine, null, 2)}</pre>
            </section>
          )}
        </>
      ) : (
        <div className="empty">暂无会员信息</div>
      )}
    </Page>
  );
}
