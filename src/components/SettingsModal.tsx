import { useState, type ReactNode } from "react";
import {
  CircleUserRound,
  Info,
  MonitorCog,
  ShieldCheck,
  X,
} from "lucide-react";
import { usePlayerStore } from "../store/playerStore";
import type { ThemePreference } from "../store/playerStore";

const APP_THEMES: Array<{ id: ThemePreference; name: string }> = [
  { id: "system", name: "跟随系统" },
  { id: "light", name: "浅色" },
  { id: "dark", name: "深色" },
];

const PRIVACY_TEXT = `· 个人数据（界面设置、最近播放、登录 Cookie 等）仅保存在本机，不会上传到 Reverie 的服务器。
· 登录 Cookie 只在调用网易云音乐接口时用于身份认证。
· 首页城市信息由第三方 IP 定位服务获取，仅用于展示。
· 本应用不收集统计数据，不进行行为追踪。`;

const DISCLAIMER_TEXT = `· Reverie 是开源音乐播放器，仅供个人学习与交流使用。
· 音乐数据来源于 NeteaseCloudMusicApi，歌曲版权归各版权方所有。
· 本应用与网易云音乐及其关联公司无隶属或合作关系。
· 若涉及合法权益问题，请联系移除相关内容。`;

type Category = "general" | "account" | "about";
type Panel = "privacy" | "disclaimer" | null;

const CATEGORIES: Array<{
  id: Category;
  label: string;
  icon: ReactNode;
}> = [
  { id: "general", label: "常规", icon: <MonitorCog size={17} /> },
  { id: "account", label: "账号", icon: <CircleUserRound size={17} /> },
  { id: "about", label: "关于", icon: <Info size={17} /> },
];

function SettingRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="setting-row">
      <label>
        {title}
        {hint && <span className="setting-hint">{hint}</span>}
      </label>
      <div className="setting-control">{children}</div>
    </div>
  );
}

export default function SettingsModal() {
  const [category, setCategory] = useState<Category>("general");
  const [panel, setPanel] = useState<Panel>(null);
  const showSettings = usePlayerStore((s) => s.showSettings);
  const setShowSettings = usePlayerStore((s) => s.setShowSettings);
  const theme = usePlayerStore((s) => s.theme);
  const setTheme = usePlayerStore((s) => s.setTheme);
  const loggedIn = usePlayerStore((s) => s.loggedIn);
  const profile = usePlayerStore((s) => s.profile);
  const logout = usePlayerStore((s) => s.logout);
  const checkUpdate = usePlayerStore((s) => s.checkUpdate);
  const updatePhase = usePlayerStore((s) => s.updatePhase);

  if (!showSettings) return null;

  const close = () => setShowSettings(false);
  const checking = updatePhase === "checking";

  return (
    <div className="modal-backdrop settings-backdrop" onClick={close}>
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="settings-sidebar">
          <div className="settings-brand">
            <div>
              <strong>设置</strong>
              <small>Reverie</small>
            </div>
          </div>
          <nav>
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                className={category === item.id ? "active" : ""}
                onClick={() => setCategory(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="settings-sidebar-footer">
            <ShieldCheck size={15} /> 本地保存
          </div>
        </aside>

        <section className="settings-content">
          <header className="settings-content-header">
            <div>
              <h2>{CATEGORIES.find((item) => item.id === category)?.label}</h2>
              <p>调整 Reverie 的使用体验</p>
            </div>
            <button className="icon-btn" onClick={close} title="关闭设置">
              <X size={19} />
            </button>
          </header>

          <div className="settings-scroll">
            {category === "general" && (
              <div className="settings-section">
                <h3>界面</h3>
                <SettingRow title="界面主题" hint="切换应用的整体明暗外观">
                  <div className="opt-group">
                    {APP_THEMES.map((item) => (
                      <button
                        key={item.id}
                        className={`opt-btn ${theme === item.id ? "active" : ""}`}
                        onClick={() => setTheme(item.id)}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </div>
            )}

            {category === "account" && (
              <div className="settings-section">
                <h3>账号</h3>
                <SettingRow
                  title={profile?.nickname || "未登录"}
                  hint={loggedIn ? "网易云音乐账号" : "登录后同步收藏内容"}
                >
                  {loggedIn ? (
                    <button className="btn danger" onClick={logout}>
                      退出登录
                    </button>
                  ) : (
                    <span className="setting-status">未登录</span>
                  )}
                </SettingRow>
              </div>
            )}

            {category === "about" && (
              <div className="settings-section">
                <h3>应用</h3>
                <SettingRow
                  title={`Reverie v${__APP_VERSION__}`}
                  hint={`${window.ncm?.versions.runtime ?? "Tauri"} · WebView ${window.ncm?.versions.webview ?? "—"}`}
                >
                  <button
                    className="btn"
                    onClick={() => checkUpdate(true)}
                    disabled={checking}
                  >
                    {checking ? "检查中…" : "检查更新"}
                  </button>
                </SettingRow>
                <SettingRow title="隐私说明">
                  <button
                    className="btn"
                    onClick={() =>
                      setPanel(panel === "privacy" ? null : "privacy")
                    }
                  >
                    {panel === "privacy" ? "收起" : "查看"}
                  </button>
                </SettingRow>
                {panel === "privacy" && (
                  <div className="about-panel">{PRIVACY_TEXT}</div>
                )}
                <SettingRow title="免责声明">
                  <button
                    className="btn"
                    onClick={() =>
                      setPanel(panel === "disclaimer" ? null : "disclaimer")
                    }
                  >
                    {panel === "disclaimer" ? "收起" : "查看"}
                  </button>
                </SettingRow>
                {panel === "disclaimer" && (
                  <div className="about-panel">{DISCLAIMER_TEXT}</div>
                )}
                <p className="settings-legal">
                  数据来源：NeteaseCloudMusicApi · 仅供学习交流
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
