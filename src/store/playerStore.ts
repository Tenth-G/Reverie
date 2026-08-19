import { create } from 'zustand'
import {
  clearCookie,
  fmTrash,
  getCookie,
  getLikedIds,
  getLyric,
  getPlaylistDetail,
  getHotPlaylists,
  getRecommendSongs,
  getSongsByIds,
  getSongUrl,
  getTopSongs,
  getUserPlaylists,
  getVipInfo,
  likeSong,
  loginStatus,
  searchSongs,
  setCookie,
} from '../api/client'
import type { LyricLine, PlaylistInfo, PlayMode, Song, UserProfile, View } from '../api/types'
import type { VipInfo } from '../api/client'
import { parseLyrics, pickRandomLyricLine } from '../utils/lyrics'

export interface ToastMsg {
  id: number
  text: string
  type: 'info' | 'error' | 'success'
}

export type ThemePreference = 'system' | 'light' | 'dark'

/* ------------------------- persistence helpers ------------------------- */
function readNum(key: string, def: number): number {
  try {
    const v = Number(localStorage.getItem(key))
    return Number.isFinite(v) ? v : def
  } catch {
    return def
  }
}
function readBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? def : v === '1'
  } catch {
    return def
  }
}
function readStr(key: string, def: string): string {
  try {
    return localStorage.getItem(key) ?? def
  } catch {
    return def
  }
}
function write(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* ignore */
  }
}

function readThemePref(): ThemePreference {
  const v = readStr('reverie_theme', 'system') as ThemePreference
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

interface RecentSongData {
  id: number
  name: string
  artists: string
  artistNames: string[]
  album: string
  albumId: number
  picUrl: string
  duration: number
  fee: number
  mvId?: number
}

function readRecentSongs(): Song[] {
  try {
    const raw = localStorage.getItem('reverie_recent')
    if (!raw) return []
    const arr = JSON.parse(raw) as RecentSongData[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

let toastSeq = 0

interface PlayerState {
  // --- auth ---
  loggedIn: boolean
  profile: UserProfile | null
  likedIds: number[]
  likedSongs: Song[]
  vipInfo: VipInfo | null
  recentSongs: Song[]
  homeQuote: { text: string; source: string } | null

  // --- audio ---
  audioEl: HTMLAudioElement | null
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

  // --- appearance ---
  theme: ThemePreference
  lyricTheme: string
  lyricFontSize: number

  // --- ui / data ---
  activeView: View
  currentPage: 'browse' | 'nowplaying'
  searchOpen: boolean
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
  fmSongs: Song[]
  showLogin: boolean
  showSettings: boolean
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
  setTheme: (t: ThemePreference) => void
  setLyricTheme: (t: string) => void
  setLyricFontSize: (s: number) => void
  setShowLogin: (v: boolean) => void
  setShowSettings: (v: boolean) => void
  setActiveView: (v: View) => void
  setPage: (p: 'browse' | 'nowplaying') => void
  setSearchOpen: (v: boolean) => void
  loadHome: () => Promise<void>
  doSearch: (kw: string) => Promise<void>
  loadTopSongs: () => Promise<void>
  loadPersonalFm: () => Promise<void>
  loadUserPlaylists: () => Promise<void>
  openPlaylist: (id: number, name: string) => Promise<void>
  closePlaylist: () => void
  playSong: (song: Song, queue?: Song[]) => Promise<void>
  playQueueAt: (i: number) => Promise<void>
  fmNext: () => Promise<void>
  fmDislike: () => Promise<void>
  toggleLike: () => Promise<void>
  loadLiked: () => Promise<void>
  loadLikedSongs: () => Promise<void>
  loadVipInfo: () => Promise<void>
  trackRecent: (song: Song) => void
  loadHomeQuote: () => Promise<void>
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
  likedIds: [],
  likedSongs: [],
  vipInfo: null,
  recentSongs: readRecentSongs(),
  homeQuote: null,

  // --- audio ---
  audioEl: null,
  currentSong: null,
  currentUrl: null,
  loadingUrl: false,
  playing: false,
  progress: 0,
  duration: 0,
  volume: readNum('reverie_volume', 0.9),
  muted: false,
  playMode: (readStr('reverie_playmode', 'sequence') as PlayMode) || 'sequence',

  // --- queue ---
  queue: [],
  index: -1,

  // --- lyrics ---
  lyricLines: [],
  showTranslation: readBool('reverie_translation', true),

  // --- appearance ---
  theme: readThemePref(),
  lyricTheme: readStr('reverie_lyrictheme', 'neon'),
  lyricFontSize: readNum('reverie_lyricfont', 22),

  // --- ui / data ---
  activeView: 'home',
  currentPage: 'browse',
  searchOpen: false,
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
  fmSongs: [],
  showLogin: false,
  showSettings: false,
  toasts: [],

  // --- toast ---
  toast: (text, type = 'info') => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts, { id, text, type }] }))
    setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setAudioEl: (el) => {
    if (!el) return
    if (get().audioEl === el) return
    set({ audioEl: el })
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
    write('reverie_volume', String(vol))
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
    const next = order[(order.indexOf(cur) + 1) % order.length]
    set({ playMode: next })
    write('reverie_playmode', next)
  },
  setShowTranslation: (v) => {
    set({ showTranslation: v })
    write('reverie_translation', v ? '1' : '0')
  },
  setTheme: (t) => {
    set({ theme: t })
    write('reverie_theme', t)
  },
  setLyricTheme: (t) => {
    set({ lyricTheme: t })
    write('reverie_lyrictheme', t)
  },
  setLyricFontSize: (s) => {
    set({ lyricFontSize: s })
    write('reverie_lyricfont', String(s))
  },
  setShowLogin: (v) => set({ showLogin: v }),
  setShowSettings: (v) => set({ showSettings: v }),
  setActiveView: (v) => set({ activeView: v }),
  setPage: (p) => set({ currentPage: p }),
  setSearchOpen: (v) => set({ searchOpen: v }),

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
      getRecommendSongs().then((songs) => set({ recommendSongs: songs })).catch(() => {})
    }
  },

  // --- discovery ---
  doSearch: async (kw) => {
    const key = kw.trim()
    set({ searchKeyword: key, searchOpen: true, searching: true })
    if (!key) {
      set({ searching: false, searchResults: [] })
      return
    }
    if (!get().loggedIn) {
      // not logged in: don't load/display any data
      set({ searching: false, searchResults: [] })
      return
    }
    try {
      const results = await searchSongs(key, 30)
      set({ searchResults: results, searching: false })
      if (!results.length) get().toast('没有找到相关歌曲', 'info')
    } catch {
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
  loadPersonalFm: async () => {
    // 漫游：随机播放歌曲
    if (!get().loggedIn) {
      get().toast('请先登录', 'info')
      set({ showLogin: true })
      return
    }
    set({ activeView: 'fm' })
    try {
      const songs = await getTopSongs(0, 60)
      const shuffled = [...songs].sort(() => Math.random() - 0.5)
      set({ fmSongs: shuffled, playMode: 'shuffle' })
      if (shuffled.length) get().playSong(shuffled[0], shuffled)
      else get().toast('暂无内容', 'info')
    } catch {
      get().toast('加载随机歌曲失败', 'error')
    }
  },
  loadUserPlaylists: async () => {
    const uid = get().profile?.userId
    if (!uid) {
      get().toast('请先登录', 'info')
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
    set({ activeView: 'home' })
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
    get().trackRecent(song)

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
  fmNext: async () => {
    // 漫游：播完一批后换一批新的随机歌曲
    const { queue, index } = get()
    const nextIdx = index + 1
    if (nextIdx < queue.length) {
      await get().playQueueAt(nextIdx)
      return
    }
    try {
      const songs = await getTopSongs(0, 60)
      const shuffled = [...songs].sort(() => Math.random() - 0.5)
      set({ fmSongs: shuffled })
      await get().playSong(shuffled[0], shuffled)
    } catch {
      get().toast('加载下一批失败', 'error')
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

  // --- like / red heart ---
  toggleLike: async () => {
    const { currentSong, likedIds, loggedIn } = get()
    if (!currentSong) return
    if (!loggedIn) {
      get().toast('请先登录', 'info')
      set({ showLogin: true })
      return
    }
    const liked = likedIds.includes(currentSong.id)
    const next = !liked
    try {
      await likeSong(currentSong.id, next)
      set({
        likedIds: next
          ? [...likedIds, currentSong.id]
          : likedIds.filter((id) => id !== currentSong.id),
      })
      get().loadLikedSongs()
      get().toast(next ? '已添加到我喜欢' : '已取消喜欢', 'success')
    } catch {
      get().toast('操作失败', 'error')
    }
  },
  loadLiked: async () => {
    const uid = get().profile?.userId
    if (!uid) return
    try {
      const ids = await getLikedIds(uid)
      set({ likedIds: ids })
    } catch {
      /* ignore */
    }
  },
  loadLikedSongs: async () => {
    const { likedIds } = get()
    if (!likedIds.length) {
      set({ likedSongs: [] })
      return
    }
    try {
      const songs: Song[] = []
      for (let i = 0; i < likedIds.length; i += 200) {
        const chunk = await getSongsByIds(likedIds.slice(i, i + 200))
        songs.push(...chunk)
      }
      set({ likedSongs: songs })
    } catch {
      /* ignore */
    }
  },
  loadVipInfo: async () => {
    const uid = get().profile?.userId
    if (!uid) return
    try {
      const info = await getVipInfo(uid)
      set({ vipInfo: info })
    } catch {
      /* ignore */
    }
  },
  trackRecent: (song) => {
    const next = [song, ...get().recentSongs.filter((s) => s.id !== song.id)].slice(0, 50)
    set({ recentSongs: next })
    try {
      localStorage.setItem('reverie_recent', JSON.stringify(next))
    } catch {
      /* ignore */
    }
  },
  loadHomeQuote: async () => {
    const pool = [186016, 347230, 509781655, 3414449762, 168160, 193535]
    const id = pool[Math.floor(Math.random() * pool.length)]
    try {
      const songs = await getSongsByIds([id])
      const song = songs[0]
      if (!song) return
      const { lrc } = await getLyric(id)
      const line = pickRandomLyricLine(lrc)
      if (line) {
        set({ homeQuote: { text: line, source: `《${song.name}》· ${song.artists}` } })
      }
    } catch {
      /* keep previous quote */
    }
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
        get().loadLiked()
        get().loadLikedSongs()
        get().loadVipInfo()
        if (!get().recommendSongs.length) {
          getRecommendSongs().then((songs) => set({ recommendSongs: songs })).catch(() => {})
        }
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
    // stop playback and clear the current session
    const el = get().audioEl
    if (el) {
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
    set({
      loggedIn: false,
      profile: null,
      likedIds: [],
      userPlaylists: [],
      recommendSongs: [],
      fmSongs: [],
      currentSong: null,
      currentUrl: null,
      playing: false,
      progress: 0,
      duration: 0,
      queue: [],
      index: -1,
      lyricLines: [],
    })
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
      if (profile && profile.userId > 0) {
        set({ loggedIn: true, profile })
        get().loadLiked()
        get().loadLikedSongs()
        get().loadVipInfo()
        if (!get().recommendSongs.length) {
          getRecommendSongs().then((songs) => set({ recommendSongs: songs })).catch(() => {})
        }
      } else {
        clearCookie()
        set({ loggedIn: false, profile: null })
      }
    } catch {
      /* keep current state */
    }
  },
}))
