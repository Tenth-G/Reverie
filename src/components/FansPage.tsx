import { useEffect } from "react";
import { BarChart3, Map, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useFansStore } from "../store/fansStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";
export default function FansPage() {
  const auth = useFansStore((s) => s.auth);
  const overview = useFansStore((s) => s.overview);
  const trend = useFansStore((s) => s.trend);
  const age = useFansStore((s) => s.age);
  const gender = useFansStore((s) => s.gender);
  const province = useFansStore((s) => s.province);
  const loading = useFansStore((s) => s.loading);
  const error = useFansStore((s) => s.error);
  const load = useFansStore((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader
        title="粉丝中心"
        subtitle="粉丝规模、增长趋势与画像"
        actions={
          <button
            className="icon-button"
            title="刷新"
            onClick={() => void load()}
          >
            <RefreshCw size={17} />
          </button>
        }
      />
      {loading && !overview ? (
        <LoadingState label="正在加载粉丝数据…" />
      ) : (
        <>
          {auth && (
            <div className="fans-auth">
              <ShieldCheck size={17} />
              <span>
                {auth.authenticated
                  ? `${auth.name || "音乐人"} 已认证`
                  : "当前账号未认证为音乐人"}
              </span>
            </div>
          )}
          {overview && (
            <div className="fans-summary">
              <div>
                <Users size={17} />
                <span>粉丝总数</span>
                <strong>{overview.total.toLocaleString("zh-CN")}</strong>
              </div>
              <div>
                <BarChart3 size={17} />
                <span>今日新增</span>
                <strong>+{overview.todayAdded}</strong>
              </div>
              <div>
                <Map size={17} />
                <span>今日流失</span>
                <strong>-{overview.todayLost}</strong>
              </div>
            </div>
          )}
          <section className="fans-section">
            <div className="fans-head">
              <h2>增长趋势</h2>
              <span>{trend.length} 个数据点</span>
            </div>
            <div className="fans-trend">
              {trend.slice(-14).map((point) => (
                <div key={point.date} title={`${point.date}: ${point.count}`}>
                  <i
                    style={{
                      height: `${Math.max(8, Math.min(100, point.count))}%`,
                    }}
                  />
                  <small>{point.date.slice(-5)}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="fans-section">
            <div className="fans-head">
              <h2>粉丝画像</h2>
            </div>
            <div className="fans-demographics">
              <Distribution title="年龄" values={age} />
              <Distribution title="性别" values={gender} />
              <Distribution title="地区" values={province} />
            </div>
          </section>
        </>
      )}
      {error && (
        <div className="fans-error" role="alert">
          {error}
        </div>
      )}
    </Page>
  );
}
function Distribution({
  title,
  values,
}: {
  title: string;
  values: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="fans-distribution">
      <h3>{title}</h3>
      {values.slice(0, 6).map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  );
}
