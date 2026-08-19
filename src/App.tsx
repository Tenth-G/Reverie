import { useEffect, useRef } from 'react'
import { usePlayerStore } from './store/playerStore'
import TitleBar from './components/TitleBar'
import TopNav from './components/TopNav'
import PlayerBar from './components/PlayerBar'
import NowPlayingView from './components/NowPlayingView'
import HomePage from './components/HomePage'
import ChartPage from './components/ChartPage'
import PlaylistPage from './components/PlaylistPage'
import FmPage from './components/FmPage'
import UserListPage from './components/UserListPage'
import LoginModal from './components/LoginModal'
import SettingsModal from './components/SettingsModal'
import Toasts from './components/Toasts'

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentUrl = usePlayerStore((s) => s.currentUrl)
  const playing = usePlayerStore((s) => s.playing)
  const theme = usePlayerStore((s) => s.theme)
  const setAudioEl = usePlayerStore((s) => s.setAudioEl)

  const activeView = usePlayerStore((s) => s.activeView)
  const currentPage = usePlayerStore((s) => s.currentPage)

  const refreshLogin = usePlayerStore((s) => s.refreshLogin)
  const loadHome = usePlayerStore((s) => s.loadHome)
  const next = usePlayerStore((s) => s.next)

  // register audio element
  useEffect(() => {
    if (audioRef.current) setAudioEl(audioRef.current)
  }, [setAudioEl])

  // restore login session + load home on startup
  useEffect(() => {
    refreshLogin()
    loadHome()
  }, [refreshLogin, loadHome])

  // theme: follow system / light / dark
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const effective = theme === 'system' ? (mql.matches ? 'dark' : 'light') : theme
      document.documentElement.setAttribute('data-theme', effective)
    }
    apply()
    if (theme === 'system') {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
  }, [theme])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      const s = usePlayerStore.getState()
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          s.togglePlay()
          break
        case 'ArrowRight':
          s.seek(Math.min(s.duration, s.progress + 5000))
          break
        case 'ArrowLeft':
          s.seek(Math.max(0, s.progress - 5000))
          break
        case 'ArrowUp':
          s.setVolume(s.volume + 0.05)
          break
        case 'ArrowDown':
          s.setVolume(s.volume - 0.05)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // set src + play on url change
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (currentUrl) {
      a.src = currentUrl
      a.load()
      a.play().catch(() => {})
    } else {
      a.pause()
      a.removeAttribute('src')
      a.load()
    }
  }, [currentUrl])

  // react to play/pause toggle
  useEffect(() => {
    const a = audioRef.current
    if (!a || !currentUrl) return
    if (playing) a.play().catch(() => {})
    else a.pause()
  }, [playing, currentUrl])

  const handleEnded = () => {
    const st = usePlayerStore.getState()
    const { queue, index, playMode: mode, fmSongs } = st
    if (mode === 'one') {
      st.seek(0)
      audioRef.current?.play().catch(() => {})
      return
    }
    if (queue.length > 0 && queue === fmSongs) {
      st.fmNext()
      return
    }
    if (mode === 'sequence' && index >= queue.length - 1) {
      usePlayerStore.setState({ playing: false })
      return
    }
    next()
  }

  const renderPage = () => {
    switch (activeView) {
      case 'home':
        return <HomePage />
      case 'chart':
        return <ChartPage />
      case 'playlist':
        return <PlaylistPage />
      case 'fm':
        return <FmPage />
      case 'userlist':
        return <UserListPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="app">
      <TitleBar />
      {currentPage !== 'nowplaying' && <TopNav />}
      {currentPage === 'nowplaying' ? (
        <NowPlayingView />
      ) : (
        <main className="page-content">{renderPage()}</main>
      )}
      <PlayerBar />
      <LoginModal />
      <SettingsModal />
      <Toasts />

      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          usePlayerStore.setState({
            progress: Math.floor(el.currentTime * 1000),
            duration: Number.isFinite(el.duration) ? Math.floor(el.duration * 1000) : 0,
          })
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget
          if (Number.isFinite(el.duration)) {
            usePlayerStore.setState({ duration: Math.floor(el.duration * 1000) })
          }
        }}
        onEnded={handleEnded}
        onError={() => {
          usePlayerStore.setState({ playing: false })
          usePlayerStore.getState().toast('音频加载失败', 'error')
        }}
        style={{ display: 'none' }}
      />
    </div>
  )
}
