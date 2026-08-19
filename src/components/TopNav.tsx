import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/playerStore'
import type { ThemePreference } from '../store/playerStore'
import type { View } from '../api/types'
import type { ReactElement } from 'react'
import {
  IconChart,
  IconClose,
  IconHeart,
  IconHome,
  IconList,
  IconLogin,
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

const NAV: NavItem[] = [
  { view: 'home', label: '首页', icon: <IconHome /> },
  { view: 'chart', label: '排行榜', icon: <IconChart /> },
  { view: 'playlist', label: '推荐歌单', icon: <IconList /> },
  { view: 'recommend', label: '每日推荐', icon: <IconHeart />, auth: true },
  { view: 'fm', label: '私人FM', icon: <IconRadio />, auth: true },
  { view: 'userlist', label: '我的歌单', icon: <IconMusic />, auth: true },
  { view: 'queue', label: '播放队列', icon: <IconQueue /> },
]

const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark']
const THEME_ICON = { system: <IconMonitor />, light: <IconSun />, dark: <IconMoon /> }
const THEME_LABEL = { system: '跟随系统', light: '浅色', dark: '深色' }

export default function TopNav() {
  const activeView = usePlayerStore((s) => s.activeView)
  const loggedIn = usePlayerStore((s) => s.loggedIn)
  const profile = usePlayerStore((s) => s.profile)
  const theme = usePlayerStore((s) => s.theme)
  const searchOpen = usePlayerStore((s) => s.searchOpen)
  const searchKeyword = usePlayerStore((s) => s.searchKeyword)

  const setActiveView = usePlayerStore((s) => s.setActiveView)
  const setPage = usePlayerStore((s) => s.setPage)
  const setTheme = usePlayerStore((s) => s.setTheme)
  const setSearchOpen = usePlayerStore((s) => s.setSearchOpen)
  const doSearch = usePlayerStore((s) => s.doSearch)
  const setShowLogin = usePlayerStore((s) => s.setShowLogin)
  const setShowSettings = usePlayerStore((s) => s.setShowSettings)
  const loadTopSongs = usePlayerStore((s) => s.loadTopSongs)
  const loadHotPlaylists = usePlayerStore((s) => s.loadHotPlaylists)
  const loadRecommend = usePlayerStore((s) => s.loadRecommend)
  const loadPersonalFm = usePlayerStore((s) => s.loadPersonalFm)
  const loadUserPlaylists = usePlayerStore((s) => s.loadUserPlaylists)
  const loadHome = usePlayerStore((s) => s.loadHome)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const handleNav = (view: View, auth?: boolean) => {
    if (auth && !loggedIn) {
      setShowLogin(true)
      return
    }
    setPage('browse')
    setSearchOpen(false)
    if (view === activeView) return
    switch (view) {
      case 'home':
        loadHome()
        break
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

  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <span className="dot" />
        NCM Player
      </div>

      <div className="topnav-items">
        {NAV.map((item) => (
          <button
            key={item.view}
            className={`topnav-item ${activeView === item.view && !searchOpen ? 'active' : ''}`}
            onClick={() => handleNav(item.view, item.auth)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="topnav-actions">
        {searchOpen ? (
          <div className="search-capsule">
            <IconSearch width={15} height={15} />
            <input
              ref={searchRef}
              placeholder="搜索歌曲 / 歌手 / 专辑…"
              value={searchKeyword}
              onChange={(e) => usePlayerStore.setState({ searchKeyword: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doSearch(e.currentTarget.value)
                if (e.key === 'Escape') {
                  setSearchOpen(false)
                  usePlayerStore.setState({ searchKeyword: '', searchResults: [] })
                }
              }}
            />
            <button className="search-close" onClick={() => {
              setSearchOpen(false)
              usePlayerStore.setState({ searchKeyword: '', searchResults: [] })
            }}>
              <IconClose width={13} height={13} />
            </button>
          </div>
        ) : (
          <button
            className="topnav-icon-btn"
            onClick={() => {
              setSearchOpen(true)
              setPage('browse')
            }}
            title="搜索"
          >
            <IconSearch />
          </button>
        )}

        <button className="topnav-icon-btn" onClick={cycleTheme} title={`主题：${THEME_LABEL[theme]}`}>
          {THEME_ICON[theme]}
        </button>

        <button className="topnav-icon-btn" onClick={() => setShowSettings(true)} title="设置">
          <IconSettings />
        </button>

        {loggedIn && profile ? (
          <button className="topnav-user" onClick={() => setShowSettings(true)} title={profile.nickname}>
            <img src={profile.avatarUrl} alt="" />
          </button>
        ) : (
          <button className="topnav-login" onClick={() => setShowLogin(true)}>
            <IconLogin width={14} height={14} /> 登录
          </button>
        )}
      </div>
    </nav>
  )
}
