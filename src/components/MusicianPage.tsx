import { useEffect } from "react";
import {
  BarChart3,
  Check,
  Coins,
  Gift,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMusicianStore } from "../store/musicianStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";

function count(value: number) {
  return value.toLocaleString("zh-CN");
}

export default function MusicianPage() {
  const cloudbean = useMusicianStore((state) => state.cloudbean);
  const overview = useMusicianStore((state) => state.overview);
  const trend = useMusicianStore((state) => state.trend);
  const tasks = useMusicianStore((state) => state.tasks);
  const loading = useMusicianStore((state) => state.loading);
  const signing = useMusicianStore((state) => state.signing);
  const claimingId = useMusicianStore((state) => state.claimingId);
  const error = useMusicianStore((state) => state.error);
  const load = useMusicianStore((state) => state.load);
  const sign = useMusicianStore((state) => state.sign);
  const claim = useMusicianStore((state) => state.claim);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader
        title="音乐人中心"
        subtitle="云豆、任务、数据概况与播放趋势"
        actions={
          <button
            className="icon-button"
            title="刷新"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={17} />
          </button>
        }
      />
      {overview ? (
        <div className="musician-summary">
          <div>
            <BarChart3 size={17} />
            <span>歌曲</span>
            <strong>{count(overview.songCount)}</strong>
          </div>
          <div>
            <Users size={17} />
            <span>粉丝</span>
            <strong>{count(overview.fanCount)}</strong>
          </div>
          <div>
            <Gift size={17} />
            <span>播放</span>
            <strong>{count(overview.playCount)}</strong>
          </div>
          <div>
            <Coins size={17} />
            <span>云豆</span>
            <strong>{count(cloudbean || overview.cloudbean)}</strong>
          </div>
          <button
            className="primary-button"
            onClick={() => void sign()}
            disabled={signing}
          >
            <ShieldCheck size={15} />
            {signing ? "签到中…" : "音乐人签到"}
          </button>
        </div>
      ) : loading ? (
        <LoadingState label="正在加载音乐人数据…" />
      ) : null}
      {trend.length > 0 && (
        <section className="musician-section">
          <div className="musician-section-head">
            <h2>播放趋势</h2>
            <span>近期数据</span>
          </div>
          <div className="musician-trend">
            {trend.slice(-14).map((point) => (
              <div
                className="musician-trend-bar"
                key={point.date}
                title={`${point.date}: ${count(point.count)}`}
              >
                <i
                  style={{
                    height: `${Math.max(8, Math.min(100, (point.count / Math.max(...trend.map((item) => item.count), 1)) * 100))}%`,
                  }}
                />
                <small>{point.date.slice(-5)}</small>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="musician-section">
        <div className="musician-section-head">
          <h2>任务</h2>
          <span>{tasks.length} 项</span>
        </div>
        {tasks.length ? (
          <div className="musician-task-list">
            {tasks.map((task) => (
              <div className="musician-task" key={task.id}>
                <div>
                  <strong>{task.name}</strong>
                  <span>
                    {task.description || `完成后获得 ${task.reward} 云豆`}
                  </span>
                </div>
                <div>
                  <b>+{task.reward}</b>
                  <button
                    className="secondary-button"
                    disabled={
                      task.status === "claimed" ||
                      claimingId === (task.userMissionId ?? task.id)
                    }
                    onClick={() => void claim(task)}
                  >
                    {task.status === "claimed" ? (
                      <>
                        <Check size={14} />
                        已领取
                      </>
                    ) : (
                      "领取"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="musician-empty">暂无音乐人任务</div>
        )}
      </section>
      {error && (
        <div className="musician-error" role="alert">
          {error}
        </div>
      )}
    </Page>
  );
}
