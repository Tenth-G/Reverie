import { create } from 'zustand'
import {
  clearCookie,
  fmTrash,
  getCookie,
  getLyric,
  getPersonalFm,
  getPlaylistDetail,
  getHotPlaylists,
  getRecommendSongs,
  getSongUrl,
  getTopSongs,
  getUserPlaylists,
  loginStatus,
  searchSongs,
  setCookie,
} from '../api/client'
import type { LyricLine, PlaylistInfo, PlayMode, Song, UserProfile, View } from '../api/types'
import { parseLyrics } from '../utils/lyrics'

export interface ToastMsg {
  id: number
  text: string
  type: 'info' | 'error' | 'success'
}

export type ThemePreference = 'system' | 'light' | 'dark'
export type LyricsMode = 'overlay' | 'immersive'

function readThemePref(): ThemePreference {
  try {
    const v = localStorage.getItem('ncm_theme') as ThemePreference | null
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

let toastSeq = 0

interface PlayerState {
  // --- auth ---
  loggedIn: boolean
  profile: UserProfile | null

  // --- audio ---
  audioEl: HTMLAudioElement | null
  analyser: AnalyserNode | null
  currentSong: Song | null
  currentUrl: string | null
  loadingUrl: boolean
  playing: boolean
  progress: number
  duration: number
  volume: number
  muted: boolean
  playMode: PlayMode

  // --- queue ---
  queue: Song[]
  index: number

  // --- lyrics ---
  lyricLines: LyricLine[]
  showTranslation: boolean
  lyricsMode: LyricsMode
  showLyrics: boolean

  // --- appearance ---
  theme: ThemePreference

  // --- ui / data ---
  activeView: View
  currentPage: 'browse' | 'nowplaying'
  searchKeyword: string
  searchResults: Song[]
  searching: boolean
  topSongs: Song[]
  topSongsLoading: boolean
  hotPlaylists: PlaylistInfo[]
  hotPlaylistsLoading: boolean
  userPlaylists: PlaylistInfo[]
  playlistSongs: Song[]
  playlistName: string
  recommendSongs: Song[]
  recommendLoading: boolean
  fmSongs: Song[]
  showLogin: boolean
  showSettings: boolean
  lyricTheme: string
  lyricFontSize: number
  visualizerMode: string
  toasts: ToastMsg[]

  // --- actions ---
  setAudioEl: (el: HTMLAudioElement) => void
  toast: (text: string, type?: ToastMsg['type']) => void
  dismissToast: (id: number) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (ms: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  cyclePlayMode: () => void
  setShowTranslation: (v: boolean) => void
  setLyricsMode: (m: LyricsMode) => void
  setShowLyrics: (v: boolean) => void
  setTheme: (t: ThemePreference) => void
  setLyricTheme: (t: string) => void
  setLyricFontSize: (s: number) => void
  setVisualizerMode: (m: string) => void
  setShowLogin: (v: boolean) => void
  setShowSettings: (v: boolean) => void
  setActiveView: (v: View) => void
  setPage: (p: 'browse' | 'nowplaying') => void
  loadHome: () => Promise<void>
  doSearch: (kw: string) => Promise<void>
  loadTopSongs: () => Promise<void>
  loadHotPlaylists: () => Promise<void>
  loadRecommend: () => Promise<void>
  loadPersonalFm: () => Promise<void>
  loadUserPlaylists: () => Promise<void>
  openPlaylist: (id: number, name: string) => Promise<void>
  closePlaylist: () => void
  playSong: (song: Song, queue?: Song[]) => Promise<void>
  playQueueAt: (i: number) => Promise<void>
  removeFromQueue: (i: number) => void
  clearQueue: () => void
  fmNext: () => Promise<void>
  fmDislike: () => Promise<void>
  applyLogin: (cookie: string) => Promise<boolean>
  logout: () => void
  refreshLogin: () => Promise<void>
}

function loadLyricsFor(song: Song, set: (p: Partial<PlayerState>) => void) {
  set({ lyricLines: [{ time: 0, text: '加载歌词中…' }] })
  getLyric(song.id)
    .then(({ lrc, tlyric }) => {
      set({ lyricLines: parseLyrics(lrc, tlyric) })
    })
    .catch(() => set({ lyricLines: [{ time: 0, text: '暂无歌词' }] }))
}

async function resolveUrl(song: Song): Promise<string | null> {
  for (const level of ['exhigh', 'higher', 'standard'] as const) {
    try {
      const { url } = await getSongUrl(song.id, level)
      if (url) return url
    } catch {
      /* try next level */
    }
  }
  return null
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  // --- auth ---
  loggedIn: false,
  profile: null,

  // --- audio ---
  audioEl: null,
  analyser: null,
  currentSong: null,
  currentUrl: null,
  loadingUrl: false,
  playing: false,
  progress: 0,
  duration: 0,
  volume: 0.9,
  muted: false,
  playMode: 'sequence',

  // --- queue ---
  queue: [],
  index: -1,

  // --- lyrics ---
  lyricLines: [],
  showTranslation: true,
  lyricsMode: 'overlay',
  showLyrics: true,

  // --- appearance ---
  theme: readThemePref(),

  // --- ui / data ---
  activeView: 'home',
  currentPage: 'browse',
  searchKeyword: '',
  searchResults: [],
  searching: false,
  topSongs: [],
  topSongsLoading: false,
  hotPlaylists: [],
  hotPlaylistsLoading: false,
  userPlaylists: [],
  playlistSongs: [],
  playlistName: '',
  recommendSongs: [],
  recommendLoading: false,
  fmSongs: [],
  showLogin: false,
  showSettings: false,
  lyricTheme: 'neon',
  lyricFontSize: 22,
  visualizerMode: 'spectrum',
  toasts: [],

  // --- toast ---
  toast: (text, type = 'info') => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts, { id, text, type }] }))
    setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // --- audio element wiring ---
  setAudioEl: (el) => {
    if (!el) return
    const prev = get().audioEl
    if (prev === el) return
    set({ audioEl: el })
    if (!get().analyser) {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        const ctx = new Ctx()
        const src = ctx.createMediaElementSource(el)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.82
        src.connect(analyser)
        analyser.connect(ctx.destination)
        set({ analyser })
      } catch (e) {
        console.warn('[audio] analyser init failed', e)
      }
    }
  },

  // --- playback ---
  togglePlay: () => {
    const { playing, currentUrl, currentSong } = get()
    if (!currentSong) return
    if (!currentUrl) {
      get().playSong(currentSong)
      return
    }
    set({ playing: !playing })
  },
  next: () => {
    const { queue, index, playMode } = get()
    if (!queue.length) return
    let ni = index
    if (playMode === 'shuffle') {
      ni = Math.floor(Math.random() * queue.length)
      if (queue.length > 1 && ni === index) ni = (ni + 1) % queue.length
    } else {
      ni = index + 1
      if (ni >= queue.length) ni = 0
    }
    get().playQueueAt(ni)
  },
  prev: () => {
    const { queue, index, progress } = get()
    if (!queue.length) return
    // restart current song if we're past 3s, otherwise go to previous
    if (progress > 3000) {
      get().seek(0)
      return
    }
    let pi = index - 1
    if (pi < 0) pi = queue.length - 1
    get().playQueueAt(pi)
  },
  seek: (ms) => {
    const el = get().audioEl
    set({ progress: ms })
    if (el && Number.isFinite(el.duration)) el.currentTime = ms / 1000
  },
  setVolume: (v) => {
    const vol = Math.min(1, Math.max(0, v))
    const el = get().audioEl
    set({ volume: vol, muted: vol === 0 })
    if (el) el.volume = vol
  },
  toggleMute: () => {
    const { muted, volume, audioEl } = get()
    const next = !muted
    set({ muted: next })
    if (audioEl) audioEl.volume = next ? 0 : volume
  },
  cyclePlayMode: () => {
    const order: PlayMode[] = ['sequence', 'loop', 'one', 'shuffle']
    const cur = get().playMode
    set({ playMode: order[(order.indexOf(cur) + 1) % order.length] })
  },
  setShowTranslation: (v) => set({ showTranslation: v }),
  setLyricsMode: (m) => set({ lyricsMode: m }),
  setShowLyrics: (v) => set({ showLyrics: v }),
  setTheme: (t) => {
    set({ theme: t })
    try {
      localStorage.setItem('ncm_theme', t)
    } catch {
      /* ignore */
    }
  },
  setLyricTheme: (t) => set({ lyricTheme: t }),
  setLyricFontSize: (s) => set({ lyricFontSize: s }),
  setVisualizerMode: (m) => set({ visualizerMode: m }),
  setShowLogin: (v) => set({ showLogin: v }),
  setShowSettings: (v) => set({ showSettings: v }),
  setActiveView: (v) => set({ activeView: v }),
  setPage: (p) => set({ currentPage: p }),

  // --- home dashboard ---
  loadHome: async () => {
    set({ activeView: 'home' })
    if (!get().hotPlaylists.length) {
      set({ hotPlaylistsLoading: true })
      getHotPlaylists(12).then((lists) => set({ hotPlaylists: lists, hotPlaylistsLoading: false })).catch(() => set({ hotPlaylistsLoading: false }))
    }
    if (!get().topSongs.length) {
      set({ topSongsLoading: true })
      getTopSongs(0, 10).then((songs) => set({ topSongs: songs, topSongsLoading: false })).catch(() => set({ topSongsLoading: false }))
    }
    if (get().loggedIn && !get().recommendSongs.length) {
      set({ recommendLoading: true })
      getRecommendSongs().then((songs) => set({ recommendSongs: songs, recommendLoading: false })).catch(() => set({ recommendLoading: false }))
    }
  },

  // --- discovery ---
  doSearch: async (kw) => {
    const key = kw.trim()
    set({ searchKeyword: key, activeView: 'search', searching: true })
    if (!key) {
      set({ searching: false, searchResults: [] })
      return
    }
    try {
      const results = await searchSongs(key, 50)
      set({ searchResults: results, searching: false })
      if (!results.length) get().toast('没有找到相关歌曲', 'info')
    } catch (e) {
      set({ searching: false })
      get().toast('搜索失败，请检查网络', 'error')
    }
  },
  loadTopSongs: async () => {
    set({ activeView: 'chart', topSongsLoading: true })
    try {
      const songs = await getTopSongs(0, 60)
      set({ topSongs: songs, topSongsLoading: false })
    } catch {
      set({ topSongsLoading: false })
      get().toast('加载排行榜失败', 'error')
    }
  },
  loadHotPlaylists: async () => {
    set({ activeView: 'playlist', hotPlaylistsLoading: true, playlistSongs: [], playlistName: '' })
    try {
      const lists = await getHotPlaylists(30)
      set({ hotPlaylists: lists, hotPlaylistsLoading: false })
    } catch {
      set({ hotPlaylistsLoading: false })
      get().toast('加载歌单失败', 'error')
    }
  },
  loadRecommend: async () => {
    if (!get().loggedIn) {
      get().toast('请先扫码登录', 'info')
      set({ showLogin: true })
      return
    }
    set({ activeView: 'recommend', recommendLoading: true })
    try {
      const songs = await getRecommendSongs()
      set({ recommendSongs: songs, recommendLoading: false })
      if (!songs.length) get().toast('今日推荐暂时为空', 'info')
    } catch {
      set({ recommendLoading: false })
      get().toast('加载推荐失败', 'error')
    }
  },
  loadPersonalFm: async () => {
    if (!get().loggedIn) {
      get().toast('请先扫码登录', 'info')
      set({ showLogin: true })
      return
    }
    set({ activeView: 'fm' })
    try {
      const songs = await getPersonalFm()
      set({ fmSongs: songs })
      if (songs.length) get().playSong(songs[0], songs)
      else get().toast('私人FM暂时没有内容', 'info')
    } catch {
      get().toast('加载私人FM失败', 'error')
    }
  },
  loadUserPlaylists: async () => {
    const uid = get().profile?.userId
    if (!uid) {
      get().toast('请先扫码登录', 'info')
      set({ showLogin: true })
      return
    }
    set({ activeView: 'userlist' })
    try {
      const lists = await getUserPlaylists(uid)
      set({ userPlaylists: lists })
    } catch {
      get().toast('加载我的歌单失败', 'error')
    }
  },
  openPlaylist: async (id, name) => {
    set({ activeView: 'playlist', playlistName: name })
    try {
      const { songs } = await getPlaylistDetail(id)
      set({ playlistSongs: songs })
      if (songs.length) get().toast(`已载入歌单「${name}」共 ${songs.length} 首`, 'success')
      else get().toast('歌单为空', 'info')
    } catch {
      get().toast('载入歌单失败', 'error')
    }
  },
  closePlaylist: () => {
    set({ playlistSongs: [], playlistName: '' })
  },

  // --- core play ---
  playSong: async (song, queue) => {
    const st = get()
    let targetQueue = queue
    let targetIndex = queue ? queue.findIndex((s) => s.id === song.id) : st.index
    if (!targetQueue || targetQueue.length === 0) {
      targetQueue = [song]
      targetIndex = 0
    }
    if (targetIndex < 0) targetIndex = 0

    set({
      queue: targetQueue,
      index: targetIndex,
      currentSong: song,
      loadingUrl: true,
      playing: false,
      progress: 0,
      duration: song.duration || 0,
    })
    loadLyricsFor(song, set)

    const url = await resolveUrl(song)
    if (!url) {
      set({ loadingUrl: false, currentUrl: null, playing: false })
      get().toast(
        song.fee === 1
          ? '该歌曲为 VIP 歌曲，请登录并开通会员后播放'
          : '无法获取播放地址（可能需要登录）',
        'error',
      )
      return
    }
    set({ currentUrl: url, loadingUrl: false, playing: true })
  },
  playQueueAt: async (i) => {
    const { queue } = get()
    const song = queue[i]
    if (!song) return
    await get().playSong(song, queue)
  },
  removeFromQueue: (i) => {
    const { queue, index } = get()
    if (i < 0 || i >= queue.length) return
    const next = queue.slice()
    next.splice(i, 1)
    let ni = index
    if (i < index) ni = index - 1
    else if (i === index) ni = Math.min(index, next.length - 1)
    set({ queue: next, index: next.length ? ni : -1 })
  },
  clearQueue: () => set({ queue: [], index: -1 }),
  fmNext: async () => {
    const { queue, index } = get()
    const nextIdx = index + 1
    if (nextIdx < queue.length) {
      await get().playQueueAt(nextIdx)
      return
    }
    try {
      const more = await getPersonalFm()
      if (more.length) {
        set({ fmSongs: more })
        await get().playSong(more[0], more)
      } else {
        get().toast('暂时没有更多推荐了', 'info')
      }
    } catch {
      get().toast('加载下一首失败', 'error')
    }
  },
  fmDislike: async () => {
    const { currentSong } = get()
    if (!currentSong) return
    try {
      await fmTrash(currentSong.id)
      get().toast('已标记为不喜欢，将减少推荐', 'info')
    } catch {
      /* ignore */
    }
    await get().fmNext()
  },

  // --- auth ---
  applyLogin: async (c) => {
    if (!c) return false
    setCookie(c)
    try {
      const profile = await loginStatus()
      if (profile && profile.userId > 0) {
        set({ loggedIn: true, profile })
        get().toast(`欢迎，${profile.nickname}`, 'success')
        return true
      }
      clearCookie()
      set({ loggedIn: false, profile: null })
      return false
    } catch {
      return false
    }
  },
  logout: () => {
    clearCookie()
    set({ loggedIn: false, profile: null, userPlaylists: [], recommendSongs: [], fmSongs: [] })
    get().toast('已退出登录', 'info')
  },
  refreshLogin: async () => {
    const c = getCookie()
    if (!c) {
      set({ loggedIn: false, profile: null })
      return
    }
    try {
      const profile = await loginStatus()
      if (profile && profile.userId > 0) set({ loggedIn: true, profile })
      else {
        clearCookie()
        set({ loggedIn: false, profile: null })
      }
    } catch {
      /* keep current state */
    }
  },
}))
