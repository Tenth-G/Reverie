import { useEffect, useRef } from 'react'
import { usePlayerStore } from './store/playerStore'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import Visualizer from './components/Visualizer'
import LyricsPanel from './components/LyricsPanel'
import PlayerBar from './components/PlayerBar'
import NowPlayingView from './components/NowPlayingView'
import SongList from './components/SongList'
import PlaylistGrid from './components/PlaylistGrid'
import QueuePanel from './components/QueuePanel'
import LoginModal from './components/LoginModal'
import SettingsModal from './components/SettingsModal'
import Toasts from './components/Toasts'
import { IconSearch, IconTrash } from './components/icons'

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentUrl = usePlayerStore((s) => s.currentUrl)
  const playing = usePlayerStore((s) => s.playing)
  const currentSong = usePlayerStore((s) => s.currentSong)
  const theme = usePlayerStore((s) => s.theme)
  const setAudioEl = usePlayerStore((s) => s.setAudioEl)

  const activeView = usePlayerStore((s) => s.activeView)
  const currentPage = usePlayerStore((s) => s.currentPage)
  const searchKeyword = usePlayerStore((s) => s.searchKeyword)
  const searching = usePlayerStore((s) => s.searching)
  const searchResults = usePlayerStore((s) => s.searchResults)
  const topSongs = usePlayerStore((s) => s.topSongs)
  const topSongsLoading = usePlayerStore((s) => s.topSongsLoading)
  const hotPlaylists = usePlayerStore((s) => s.hotPlaylists)
  const hotPlaylistsLoading = usePlayerStore((s) => s.hotPlaylistsLoading)
  const userPlaylists = usePlayerStore((s) => s.userPlaylists)
  const playlistSongs = usePlayerStore((s) => s.playlistSongs)
  const playlistName = usePlayerStore((s) => s.playlistName)
  const recommendSongs = usePlayerStore((s) => s.recommendSongs)
  const recommendLoading = usePlayerStore((s) => s.recommendLoading)
  const fmSongs = usePlayerStore((s) => s.fmSongs)

  const doSearch = usePlayerStore((s) => s.doSearch)
  const openPlaylist = usePlayerStore((s) => s.openPlaylist)
  const closePlaylist = usePlayerStore((s) => s.closePlaylist)
  const fmDislike = usePlayerStore((s) => s.fmDislike)
  const refreshLogin = usePlayerStore((s) => s.refreshLogin)
  const next = usePlayerStore((s) => s.next)

  // register audio element + analyser
  useEffect(() => {
    if (audioRef.current) setAudioEl(audioRef.current)
  }, [setAudioEl])

  // restore login session on startup
  useEffect(() => {
    refreshLogin()
  }, [refreshLogin])

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
      a.play().catch(() => {
        /* autoplay already allowed in Electron; ignore rejections */
      })
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
    // personal FM auto-advances and refills (detected by queue identity)
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

  const renderListPanel = () => {
    switch (activeView) {
      case 'search':
        return (
          <div className="list-panel">
            <div className="search-box">
              <input
                autoFocus
                placeholder="搜索歌曲 / 歌手 / 专辑…"
                value={searchKeyword}
                onChange={(e) => {
                  usePlayerStore.setState({ searchKeyword: e.target.value })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doSearch(e.currentTarget.value)
                }}
              />
              <button className="btn primary" onClick={() => doSearch(searchKeyword)}>
                <IconSearch width={15} height={15} />
              </button>
            </div>
            {searching ? (
              <div className="loading-hint">搜索中…</div>
            ) : (
              <div style={{ flex: 1, position: 'relative' }}>
                <SongList
                  songs={searchResults}
                  emptyText={
                    searchKeyword
                      ? '没有找到相关歌曲'
                      : '输入关键词搜索，回车或点击搜索按钮'
                  }
                />
              </div>
            )}
          </div>
        )
      case 'chart':
        return (
          <SongList
            songs={topSongs}
            title="排行榜 · 飙升榜"
            countLabel={topSongsLoading ? '加载中…' : `${topSongs.length} 首`}
            emptyText={topSongsLoading ? '加载中…' : '暂无排行数据'}
          />
        )
      case 'playlist':
        if (playlistSongs.length || playlistName) {
          return (
            <div className="list-panel">
              <div className="list-header">
                <button className="btn" onClick={closePlaylist}>
                  ← 返回
                </button>
                <h3>{playlistName}</h3>
                <span className="count">{playlistSongs.length} 首</span>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <SongList songs={playlistSongs} />
              </div>
            </div>
          )
        }
        return (
          <PlaylistGrid
            playlists={hotPlaylists}
            onOpen={openPlaylist}
            emptyText={hotPlaylistsLoading ? '加载中…' : '暂无歌单'}
          />
        )
      case 'recommend':
        return (
          <SongList
            songs={recommendSongs}
            title="每日推荐"
            countLabel={recommendLoading ? '加载中…' : `${recommendSongs.length} 首`}
            emptyText={recommendLoading ? '加载中…' : '登录后查看每日推荐'}
          />
        )
      case 'fm':
        return (
          <div className="list-panel">
            <div className="list-header">
              <h3>私人FM</h3>
              <button className="btn" onClick={fmDislike} title="不喜欢当前歌曲">
                <IconTrash width={14} height={14} /> 不喜欢
              </button>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <SongList songs={fmSongs} emptyText="登录后开启私人FM" />
            </div>
          </div>
        )
      case 'userlist':
        return (
          <PlaylistGrid
            playlists={userPlaylists}
            onOpen={openPlaylist}
            emptyText="登录后查看「我创建 / 收藏的歌单」"
          />
        )
      case 'queue':
        return <QueuePanel />
      default:
        return null
    }
  }

  return (
    <div className="app">
      <TitleBar />
      {currentPage === 'nowplaying' ? (
        <NowPlayingView />
      ) : (
        <div className="app-body">
          <Sidebar />
          <div className="main">
            <Visualizer />
            <LyricsPanel />
            <div className="stage-title">
              <div className="song">{currentSong?.name ?? 'NCM Player'}</div>
              <div className="artist">{currentSong?.artists ?? '扫码登录，畅享高品质音乐'}</div>
            </div>
            {renderListPanel()}
          </div>
        </div>
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
