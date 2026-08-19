import { usePlayerStore } from '../store/playerStore'
import type { ThemePreference } from '../store/playerStore'
import { IconClose } from './icons'

const THEMES = [
  { id: 'default', name: '经典', color: '#ec4141' },
  { id: 'neon', name: '霓虹', color: '#7df9ff' },
  { id: 'fire', name: '火焰', color: '#ffd166' },
  { id: 'aurora', name: '极光', color: '#a78bfa' },
  { id: 'mint', name: '薄荷', color: '#6ee7b7' },
  { id: 'rose', name: '玫瑰', color: '#fb7185' },
]

const VIS_MODES = [
  { id: 'spectrum', name: '频谱环' },
  { id: 'particles', name: '粒子球' },
  { id: 'wave', name: '波形' },
  { id: 'disc', name: '黑胶唱片' },
  { id: 'galaxy', name: '星系' },
  { id: 'tunnel', name: '隧道' },
]

const APP_THEMES: Array<{ id: ThemePreference; name: string }> = [
  { id: 'system', name: '跟随系统' },
  { id: 'light', name: '浅色' },
  { id: 'dark', name: '深色' },
]

export default function SettingsModal() {
  const showSettings = usePlayerStore((s) => s.showSettings)
  const setShowSettings = usePlayerStore((s) => s.setShowSettings)
  const theme = usePlayerStore((s) => s.theme)
  const setTheme = usePlayerStore((s) => s.setTheme)
  const lyricTheme = usePlayerStore((s) => s.lyricTheme)
  const setLyricTheme = usePlayerStore((s) => s.setLyricTheme)
  const lyricFontSize = usePlayerStore((s) => s.lyricFontSize)
  const setLyricFontSize = usePlayerStore((s) => s.setLyricFontSize)
  const showTranslation = usePlayerStore((s) => s.showTranslation)
  const setShowTranslation = usePlayerStore((s) => s.setShowTranslation)
  const lyricsMode = usePlayerStore((s) => s.lyricsMode)
  const setLyricsMode = usePlayerStore((s) => s.setLyricsMode)
  const visualizerMode = usePlayerStore((s) => s.visualizerMode)
  const setVisualizerMode = usePlayerStore((s) => s.setVisualizerMode)

  if (!showSettings) return null

  return (
    <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                className={`opt-btn ${theme === t.id ? 'active' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <label>歌词模式</label>
          <div className="opt-group">
            <button
              className={`opt-btn ${lyricsMode === 'overlay' ? 'active' : ''}`}
              onClick={() => setLyricsMode('overlay')}
            >
              侧边
            </button>
            <button
              className={`opt-btn ${lyricsMode === 'immersive' ? 'active' : ''}`}
              onClick={() => setLyricsMode('immersive')}
            >
              沉浸式
            </button>
          </div>
        </div>

        <div className="setting-row">
          <label>歌词特效主题</label>
          <div className="theme-dots">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-dot ${lyricTheme === t.id ? 'active' : ''}`}
                style={{ background: t.color }}
                title={t.name}
                onClick={() => setLyricTheme(t.id)}
              />
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
            style={{ width: 140, ['--val' as never]: `${((lyricFontSize - 14) / 26) * 100}%` }}
            onChange={(e) => setLyricFontSize(Number(e.target.value))}
          />
        </div>

        <div className="setting-row">
          <label>显示歌词翻译</label>
          <button
            className={`btn ${showTranslation ? 'primary' : ''}`}
            onClick={() => setShowTranslation(!showTranslation)}
          >
            {showTranslation ? '已开启' : '已关闭'}
          </button>
        </div>

        <div className="setting-row">
          <label>3D 可视化模式</label>
          <div className="opt-group">
            {VIS_MODES.map((m) => (
              <button
                key={m.id}
                className={`opt-btn ${visualizerMode === m.id ? 'active' : ''}`}
                onClick={() => setVisualizerMode(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ color: 'var(--text-faint)', fontSize: 11, lineHeight: 1.6 }}>
            NCM Player v1.2.0 · Electron {window.ncm?.versions.electron ?? '—'}
            <br />
            数据来源：NeteaseCloudMusicApi (GitHub)
            <br />
            快捷键：空格 播放/暂停 · ←→ 快退/快进 · ↑↓ 音量
          </div>
        </div>
      </div>
    </div>
  )
}
