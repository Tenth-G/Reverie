import { usePlayerStore } from '../store/playerStore'
import type { ThemePreference } from '../store/playerStore'
import type { View } from '../api/types'
import type { ReactElement } from 'react'
import {
  IconChart,
  IconHeart,
  IconList,
  IconLogin,
  IconLogout,
  IconMonitor,
  IconMoon,
  IconMusic,
  IconQueue,
  IconRadio,
  IconSearch,
  IconSettings,
  IconSun,
} from './icons'

interface NavItem {
  view: View
  label: string
  icon: ReactElement
  auth?: boolean
}

const NAV_DISCOVER: NavItem[] = [
  { view: 'search', label: '搜索', icon: <IconSearch /> },
  { view: 'chart', label: '排行榜', icon: <IconChart /> },
  { view: 'playlist', label: '推荐歌单', icon: <IconList /> },
]
const NAV_MUSIC: NavItem[] = [
  { view: 'recommend', label: '每日推荐', icon: <IconHeart />, auth: true },
  { view: 'fm', label: '私人FM', icon: <IconRadio />, auth: true },
  { view: 'userlist', label: '我的歌单', icon: <IconMusic />, auth: true },
  { view: 'queue', label: '播放队列', icon: <IconQueue /> },
]

const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark']
const THEME_ICON = { system: <IconMonitor />, light: <IconSun />, dark: <IconMoon /> }
const THEME_LABEL = { system: '跟随系统', light: '浅色', dark: '深色' }

export default function Sidebar() {
  const activeView = usePlayerStore((s) => s.activeView)
  const setActiveView = usePlayerStore((s) => s.setActiveView)
  const loggedIn = usePlayerStore((s) => s.loggedIn)
  const profile = usePlayerStore((s) => s.profile)
  const theme = usePlayerStore((s) => s.theme)
  const setTheme = usePlayerStore((s) => s.setTheme)
  const setShowLogin = usePlayerStore((s) => s.setShowLogin)
  const setShowSettings = usePlayerStore((s) => s.setShowSettings)
  const logout = usePlayerStore((s) => s.logout)
  const loadTopSongs = usePlayerStore((s) => s.loadTopSongs)
  const loadHotPlaylists = usePlayerStore((s) => s.loadHotPlaylists)
  const loadRecommend = usePlayerStore((s) => s.loadRecommend)
  const loadPersonalFm = usePlayerStore((s) => s.loadPersonalFm)
  const loadUserPlaylists = usePlayerStore((s) => s.loadUserPlaylists)

  const handleNav = (view: View, auth?: boolean) => {
    if (auth && !loggedIn) {
      setShowLogin(true)
      return
    }
    if (view === activeView) return
    switch (view) {
      case 'chart':
        loadTopSongs()
        break
      case 'playlist':
        loadHotPlaylists()
        break
      case 'recommend':
        loadRecommend()
        break
      case 'fm':
        loadPersonalFm()
        break
      case 'userlist':
        loadUserPlaylists()
        break
      default:
        setActiveView(view)
    }
  }

  const cycleTheme = () => {
    const i = THEME_ORDER.indexOf(theme)
    setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length])
  }

  const renderNav = (items: NavItem[]) =>
    items.map((item) => (
      <button
        key={item.view}
        className={`nav-item ${activeView === item.view ? 'active' : ''}`}
        onClick={() => handleNav(item.view, item.auth)}
      >
        {item.icon}
        <span>{item.label}</span>
        {item.auth && !loggedIn && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>登录</span>
        )}
      </button>
    ))

  return (
    <aside className="sidebar">
      <div className="side-section">发现</div>
      {renderNav(NAV_DISCOVER)}

      <div className="side-section">音乐</div>
      {renderNav(NAV_MUSIC)}

      <div className="sidebar-footer">
        {loggedIn && profile ? (
          <div className="user-chip" onClick={() => setShowSettings(true)} title="点击打开设置">
            <img src={profile.avatarUrl} alt="" />
            <div className="info">
              <div className="name">{profile.nickname}</div>
              <div className="sub">{profile.vipType > 0 ? 'VIP 会员' : '普通用户'}</div>
            </div>
          </div>
        ) : (
          <button className="nav-item" onClick={() => setShowLogin(true)}>
            <IconLogin />
            <span>扫码登录</span>
          </button>
        )}

        <button className="nav-item" onClick={cycleTheme} title={`当前：${THEME_LABEL[theme]}`}>
          {THEME_ICON[theme]}
          <span>主题：{THEME_LABEL[theme]}</span>
        </button>

        <button className="nav-item" onClick={() => setShowSettings(true)}>
          <IconSettings />
          <span>设置</span>
        </button>

        {loggedIn && (
          <button className="nav-item" onClick={logout}>
            <IconLogout />
            <span>退出登录</span>
          </button>
        )}
      </div>
    </aside>
  )
}
