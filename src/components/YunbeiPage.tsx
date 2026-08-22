import { useEffect } from "react";
import { Check, Coins, Gift, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useYunbeiStore } from "../store/yunbeiStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";

function formatTime(value: number) {
  if (!value) return "时间未知";
  return new Date(value < 1e12 ? value * 1000 : value).toLocaleString("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function YunbeiPage() {
  const overview = useYunbeiStore((state) => state.overview);
  const tasks = useYunbeiStore((state) => state.tasks);
  const ledger = useYunbeiStore((state) => state.ledger);
  const ledgerType = useYunbeiStore((state) => state.ledgerType);
  const loading = useYunbeiStore((state) => state.loading);
  const taskLoading = useYunbeiStore((state) => state.taskLoading);
  const ledgerLoading = useYunbeiStore((state) => state.ledgerLoading);
  const signing = useYunbeiStore((state) => state.signing);
  const claimingId = useYunbeiStore((state) => state.claimingId);
  const load = useYunbeiStore((state) => state.load);
  const sign = useYunbeiStore((state) => state.sign);
  const claim = useYunbeiStore((state) => state.claim);
  const setLedgerType = useYunbeiStore((state) => state.setLedgerType);
  const recommendCurrentSong = useYunbeiStore(
    (state) => state.recommendCurrentSong,
  );
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Page>
      <PageHeader
        title="云贝中心"
        subtitle="签到、任务与云贝记录"
        actions={
          <div className="page-action-row">
            <button
              className="btn"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} /> 刷新
            </button>
            <button className="btn" onClick={() => void recommendCurrentSong()}>
              <Send size={15} /> 推歌
            </button>
          </div>
        }
      />
      {overview ? (
        <div className="yunbei-summary">
          <div>
            <Coins size={18} />
            <span>云贝余额</span>
            <strong>{overview.balance.toLocaleString()}</strong>
          </div>
          <div>
            <Gift size={18} />
            <span>今日获得</span>
            <strong>{overview.todayEarned.toLocaleString()}</strong>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>连续签到</span>
            <strong>{overview.signDays} 天</strong>
          </div>
          <button
            className="btn primary"
            onClick={() => void sign()}
            disabled={signing || overview.signed}
          >
            {overview.signed ? (
              <>
                <Check size={15} /> 今日已签到
              </>
            ) : signing ? (
              "签到中…"
            ) : (
              "立即签到"
            )}
          </button>
        </div>
      ) : loading ? (
        <LoadingState label="正在加载云贝信息…" />
      ) : (
        <div className="empty">暂时无法获取云贝信息</div>
      )}
      <section className="yunbei-section">
        <div className="list-header">
          <h3>任务</h3>
          <span className="count">完成任务领取云贝</span>
        </div>
        {taskLoading ? (
          <LoadingState label="正在加载任务…" />
        ) : tasks.length ? (
          <div className="yunbei-task-list">
            {tasks.map((task) => (
              <div className="yunbei-task" key={task.id}>
                <div>
                  <strong>{task.name}</strong>
                  <span>
                    {task.description || `完成后可获得 ${task.point} 云贝`}
                  </span>
                </div>
                <div className="yunbei-task-action">
                  <b>+{task.point}</b>
                  <button
                    className={`btn ${task.status === "claimed" ? "active" : "primary"}`}
                    disabled={
                      task.status !== "done" ||
                      claimingId === (task.userTaskId ?? task.id)
                    }
                    onClick={() => void claim(task)}
                  >
                    {task.status === "claimed"
                      ? "已领取"
                      : task.status === "done"
                        ? "领取"
                        : "未完成"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">暂无可用任务</div>
        )}
      </section>
      <section className="yunbei-section">
        <div className="list-header">
          <h3>云贝记录</h3>
          <div className="collection-tabs">
            <button
              className={ledgerType === "income" ? "active" : ""}
              onClick={() => void setLedgerType("income")}
            >
              收入
            </button>
            <button
              className={ledgerType === "expense" ? "active" : ""}
              onClick={() => void setLedgerType("expense")}
            >
              支出
            </button>
          </div>
        </div>
        {ledgerLoading ? (
          <LoadingState label="正在加载记录…" />
        ) : ledger.length ? (
          <div className="yunbei-ledger">
            {ledger.map((entry) => (
              <div key={entry.id}>
                <span>{entry.title}</span>
                <time>{formatTime(entry.time)}</time>
                <strong
                  className={entry.type === "income" ? "income" : "expense"}
                >
                  {entry.type === "income" ? "+" : "-"}
                  {entry.amount}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">暂无记录</div>
        )}
      </section>
    </Page>
  );
}
