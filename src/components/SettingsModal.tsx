import { useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import type { ParticleEffect, ThemePreference } from "../store/playerStore";
import type { CoverQuality } from "../utils/gpuBenchmark";
import { particleCount, QUALITY_LABEL } from "../utils/gpuBenchmark";
import type { PlayMode } from "../api/types";
import { IconClose } from "./icons";

const THEMES = [
  { id: "default", name: "经典", color: "#ec4141" },
  { id: "neon", name: "霓虹", color: "#7df9ff" },
  { id: "fire", name: "火焰", color: "#ffd166" },
  { id: "aurora", name: "极光", color: "#a78bfa" },
  { id: "mint", name: "薄荷", color: "#6ee7b7" },
  { id: "rose", name: "玫瑰", color: "#fb7185" },
];

const APP_THEMES: Array<{ id: ThemePreference; name: string }> = [
  { id: "system", name: "跟随系统" },
  { id: "light", name: "浅色" },
  { id: "dark", name: "深色" },
];

const COVER_QUALITIES: CoverQuality[] = [
  "image",
  "low",
  "medium",
  "high",
  "ultra",
];

const PARTICLE_EFFECTS: Array<{
  id: ParticleEffect;
  name: string;
  hint: string;
}> = [
  { id: "none", name: "静止", hint: "不做动画，拖拽仍可旋转" },
  { id: "spin", name: "自转", hint: "封面缓慢持续旋转" },
  { id: "wave", name: "波动", hint: "粒子随正弦波起伏呼吸" },
  { id: "audio", name: "音乐律动", hint: "粒子随音乐频谱起伏与脉动" },
];

const PLAY_MODES: Array<{ id: PlayMode; name: string }> = [
  { id: "sequence", name: "顺序播放" },
  { id: "one", name: "单曲循环" },
  { id: "shuffle", name: "随机播放" },
];

const PRIVACY_TEXT = `· 您的所有个人数据（界面设置、最近播放、登录 Cookie 等）仅保存在本机，不会上传到任何服务器。
· 登录 Cookie 仅在调用网易云音乐接口时随请求发送，用于身份认证，不会用于其他用途。
· 首页问候语中的城市信息通过第三方 IP 定位服务（myip.ipip.net / ipinfo.io）获取，仅用于展示，不存储、不上传。
· 本应用不收集任何统计数据，不进行任何形式的追踪。`;

const DISCLAIMER_TEXT = `· Reverie 是一款开源音乐播放器，仅供个人学习与交流使用，请勿用于商业用途。
· 音乐数据来源于开源的 NeteaseCloudMusicApi 项目，歌曲版权归各版权方所有。
· 本应用与网易云音乐及其关联公司无任何隶属或合作关系，也不提供任何付费内容的破解或绕过。
· 若本应用侵犯了您的合法权益，请联系移除相关数据。
· 使用本应用产生的任何后果由使用者自行承担。`;

type Panel = "none" | "privacy" | "disclaimer";

export default function SettingsModal() {
  const [panel, setPanel] = useState<Panel>("none");
  const showSettings = usePlayerStore((s) => s.showSettings);
  const setShowSettings = usePlayerStore((s) => s.setShowSettings);
  const theme = usePlayerStore((s) => s.theme);
  const setTheme = usePlayerStore((s) => s.setTheme);
  const playMode = usePlayerStore((s) => s.playMode);
  const setPlayMode = usePlayerStore((s) => s.setPlayMode);
  const lyricTheme = usePlayerStore((s) => s.lyricTheme);
  const setLyricTheme = usePlayerStore((s) => s.setLyricTheme);
  const coverQuality = usePlayerStore((s) => s.coverQuality);
  const setCoverQuality = usePlayerStore((s) => s.setCoverQuality);
  const coverQualityReason = usePlayerStore((s) => s.coverQualityReason);
  const coverBenchmarking = usePlayerStore((s) => s.coverBenchmarking);
  const detectCoverQuality = usePlayerStore((s) => s.detectCoverQuality);
  const particleEffect = usePlayerStore((s) => s.particleEffect);
  const setParticleEffect = usePlayerStore((s) => s.setParticleEffect);
  const lyricFontSize = usePlayerStore((s) => s.lyricFontSize);
  const setLyricFontSize = usePlayerStore((s) => s.setLyricFontSize);
  const showTranslation = usePlayerStore((s) => s.showTranslation);
  const setShowTranslation = usePlayerStore((s) => s.setShowTranslation);
  const clearRecent = usePlayerStore((s) => s.clearRecent);
  const loggedIn = usePlayerStore((s) => s.loggedIn);
  const logout = usePlayerStore((s) => s.logout);
  const checkUpdate = usePlayerStore((s) => s.checkUpdate);
  const updatePhase = usePlayerStore((s) => s.updatePhase);
  const checking = updatePhase === "checking";

  if (!showSettings) return null;

  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? "none" : p));

  return (
    <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>设置</h2>
          <button className="icon-btn" onClick={() => setShowSettings(false)}>
            <IconClose />
          </button>
        </div>
        <p className="sub">自定义你的播放器</p>

        <div className="setting-row">
          <label>界面主题</label>
          <div className="opt-group">
            {APP_THEMES.map((t) => (
              <button
                key={t.id}
                className={`opt-btn ${theme === t.id ? "active" : ""}`}
                onClick={() => setTheme(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <label>播放模式</label>
          <div className="opt-group">
            {PLAY_MODES.map((m) => (
              <button
                key={m.id}
                className={`opt-btn ${playMode === m.id ? "active" : ""}`}
                onClick={() => setPlayMode(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <label>歌词特效主题</label>
          <div className="theme-dots">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-dot ${lyricTheme === t.id ? "active" : ""}`}
                style={{ background: t.color }}
                title={t.name}
                onClick={() => setLyricTheme(t.id)}
              />
            ))}
          </div>
        </div>

        <div className="setting-row">
          <label>
            封面画质
            <span className="setting-hint">
              {coverQuality === "image"
                ? "只显示静态专辑图，不渲染粒子"
                : `${particleCount(coverQuality).toLocaleString()} 个粒子`}
            </span>
          </label>
          <div className="opt-group">
            {COVER_QUALITIES.map((q) => (
              <button
                key={q}
                className={`opt-btn ${coverQuality === q ? "active" : ""}`}
                onClick={() => setCoverQuality(q, "手动设置")}
                title={
                  q === "image"
                    ? "低性能模式"
                    : `${particleCount(q).toLocaleString()} 个粒子`
                }
              >
                {QUALITY_LABEL[q]}
              </button>
            ))}
          </div>
        </div>

        {coverQualityReason && (
          <div className="setting-row">
            <label>
              性能检测
              <span className="setting-hint">{coverQualityReason}</span>
            </label>
            <button
              className="btn"
              onClick={() => detectCoverQuality(true)}
              disabled={coverBenchmarking}
            >
              {coverBenchmarking ? "检测中…" : "重新检测"}
            </button>
          </div>
        )}

        <div
          className="setting-row"
          style={{
            opacity: coverQuality === "image" ? 0.45 : 1,
            pointerEvents: coverQuality === "image" ? "none" : undefined,
          }}
        >
          <label>
            封面粒子效果
            <span className="setting-hint">
              {PARTICLE_EFFECTS.find((e) => e.id === particleEffect)?.hint}
            </span>
          </label>
          <div className="opt-group">
            {PARTICLE_EFFECTS.map((e) => (
              <button
                key={e.id}
                className={`opt-btn ${particleEffect === e.id ? "active" : ""}`}
                onClick={() => setParticleEffect(e.id)}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <label>歌词字号：{lyricFontSize}px</label>
          <input
            className="slider"
            type="range"
            min={14}
            max={40}
            value={lyricFontSize}
            style={{
              width: 140,
              ["--val" as never]: `${((lyricFontSize - 14) / 26) * 100}%`,
            }}
            onChange={(e) => setLyricFontSize(Number(e.target.value))}
          />
        </div>

        <div className="setting-row">
          <label>显示歌词翻译</label>
          <button
            className={`btn ${showTranslation ? "primary" : ""}`}
            onClick={() => setShowTranslation(!showTranslation)}
          >
            {showTranslation ? "已开启" : "已关闭"}
          </button>
        </div>

        <div className="setting-row">
          <label>最近播放</label>
          <button className="btn danger" onClick={clearRecent}>
            清空记录
          </button>
        </div>

        {loggedIn && (
          <div className="setting-row">
            <label>账号</label>
            <button className="btn danger" onClick={logout}>
              退出登录
            </button>
          </div>
        )}

        <div className="setting-divider" />

        <div className="setting-row">
          <label>关于</label>
          <div className="about-info">
            <div className="about-app">
              Reverie <span>v{__APP_VERSION__}</span>
            </div>
            <div className="about-meta">
              Electron {window.ncm?.versions.electron ?? "—"} · Chrome{" "}
              {window.ncm?.versions.chrome ?? "—"}
            </div>
          </div>
        </div>

        <div className="setting-row">
          <label>更新</label>
          <button
            className="btn"
            onClick={() => checkUpdate(true)}
            disabled={checking}
          >
            {checking ? "检查中…" : "检查更新"}
          </button>
        </div>

        <div className="setting-row">
          <label>隐私说明</label>
          <button className="btn" onClick={() => togglePanel("privacy")}>
            {panel === "privacy" ? "收起" : "查看"}
          </button>
        </div>
        {panel === "privacy" && (
          <div className="about-panel">{PRIVACY_TEXT}</div>
        )}

        <div className="setting-row">
          <label>免责声明</label>
          <button className="btn" onClick={() => togglePanel("disclaimer")}>
            {panel === "disclaimer" ? "收起" : "查看"}
          </button>
        </div>
        {panel === "disclaimer" && (
          <div className="about-panel">{DISCLAIMER_TEXT}</div>
        )}

        <div
          className="setting-row"
          style={{ borderBottom: "none", paddingBottom: 0 }}
        >
          <div
            style={{
              color: "var(--text-faint)",
              fontSize: 11,
              lineHeight: 1.7,
            }}
          >
            数据来源：NeteaseCloudMusicApi (GitHub) ·
            仅供学习交流，不隶属任何平台
          </div>
        </div>
      </div>
    </div>
  );
}
