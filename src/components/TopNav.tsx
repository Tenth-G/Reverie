import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/playerStore'
import type { ThemePreference } from '../store/playerStore'
import type { View } from '../api/types'
import type { ReactElement } from 'react'
import UserMenu from './UserMenu'
import {
  IconChart,
  IconClock,
  IconClose,
  IconHeart,
  IconHome,
  IconLogin,
  IconMonitor,
  IconMoon,
  IconMusic,
  IconSearch,
  IconShuffle,
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
  { view: 'userlist', label: '我的歌单', icon: <IconMusic />, auth: true },
  { view: 'fm', label: '漫游', icon: <IconShuffle />, auth: true },
]

const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark']
const THEME_ICON = { system: <IconMonitor />, light: <IconSun />, dark: <IconMoon /> }
const THEME_LABEL = { system: '跟随系统', light: '浅色', dark: '深色' }

export default function TopNav() {
  const activeView = usePlayerStore((s) => s.activeView)
  const loggedIn = usePlayerStore((s) => s.loggedIn)
  const theme = usePlayerStore((s) => s.theme)
  const searchOpen = usePlayerStore((s) => s.searchOpen)
  const searchKeyword = usePlayerStore((s) => s.searchKeyword)
  const searching = usePlayerStore((s) => s.searching)
  const searchResults = usePlayerStore((s) => s.searchResults)

  const setActiveView = usePlayerStore((s) => s.setActiveView)
  const setPage = usePlayerStore((s) => s.setPage)
  const setTheme = usePlayerStore((s) => s.setTheme)
  const setSearchOpen = usePlayerStore((s) => s.setSearchOpen)
  const doSearch = usePlayerStore((s) => s.doSearch)
  const setShowLogin = usePlayerStore((s) => s.setShowLogin)
  const loadTopSongs = usePlayerStore((s) => s.loadTopSongs)
  const loadPersonalFm = usePlayerStore((s) => s.loadPersonalFm)
  const loadUserPlaylists = usePlayerStore((s) => s.loadUserPlaylists)
  const loadHome = usePlayerStore((s) => s.loadHome)
  const playSong = usePlayerStore((s) => s.playSong)

  const searchRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [setSearchOpen])

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
    <nav className="topnav" ref={navRef}>
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
          <div className="search-wrap">
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
              <button
                className="search-close"
                onClick={() => {
                  setSearchOpen(false)
                  usePlayerStore.setState({ searchKeyword: '', searchResults: [] })
                }}
              >
                <IconClose width={13} height={13} />
              </button>
            </div>
            {searching || searchResults.length > 0 || (searchKeyword && !loggedIn) ? (
              <div className="search-dropdown">
                {searching ? (
                  <div className="loading-hint">搜索中…</div>
                ) : !loggedIn ? (
                  <div className="search-login-hint">
                    <span>登录后即可搜索音乐，请点击右上角「登录」</span>
                  </div>
                ) : (
                  searchResults.slice(0, 12).map((song) => (
                    <div
                      key={song.id}
                      className="search-dropdown-item"
                      onClick={() => {
                        playSong(song, searchResults)
                        setSearchOpen(false)
                      }}
                    >
                      {song.picUrl ? (
                        <img src={song.picUrl} alt="" />
                      ) : (
                        <span className="song-ph">♪</span>
                      )}
                      <div className="meta">
                        <div className="t">{song.name}</div>
                        <div className="a">{song.artists}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
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

        <button
          className="topnav-icon-btn"
          onClick={() => {
            setPage('browse')
            setActiveView('likes')
          }}
          title="我的喜欢"
        >
          <IconHeart />
        </button>

        <button
          className="topnav-icon-btn"
          onClick={() => {
            setPage('browse')
            setActiveView('recent')
          }}
          title="最近播放"
        >
          <IconClock />
        </button>

        {loggedIn ? (
          <UserMenu />
        ) : (
          <button className="topnav-login" onClick={() => setShowLogin(true)}>
            登录
          </button>
        )}
      </div>
    </nav>
  )
}
