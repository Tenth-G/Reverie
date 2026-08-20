import type {
  LoginStatusResponse,
  LyricResponse,
  PlaylistInfo,
  QrCheckResponse,
  QrCreateResponse,
  QrCreateResult,
  QrKeyResponse,
  SearchResponse,
  Song,
  SongDetailResponse,
  SongUrlResponse,
  UserProfile,
} from './types'

const API_BASE: string =
  (typeof window !== 'undefined' && window.ncm?.apiBase) ||
  'http://127.0.0.1:3939'

const COOKIE_KEY = 'ncm_player_cookie'

let cookie: string = ''
try {
  cookie = localStorage.getItem(COOKIE_KEY) || ''
} catch {
  cookie = ''
}

export function getCookie(): string {
  return cookie
}

export function setCookie(c: string): void {
  cookie = c
  try {
    localStorage.setItem(COOKIE_KEY, c)
  } catch {
    /* ignore */
  }
}

export function clearCookie(): void {
  cookie = ''
  try {
    localStorage.removeItem(COOKIE_KEY)
  } catch {
    /* ignore */
  }
}

async function request<T = unknown>(
  path: string,
  params: Record<string, string | number> = {},
  cacheBust = true,
): Promise<T> {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  }
  if (cookie) q.set('cookie', cookie)
  if (cacheBust) q.set('timestamp', String(Date.now()))

  const url = `${API_BASE}${path}?${q.toString()}`
  const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return (await res.json()) as T
}

/* ------------------------------------------------------------------ */
/*  Search & enrich                                                    */
/* ------------------------------------------------------------------ */

function normalizeSong(raw: unknown): Song | null {
  const s = raw as Record<string, unknown>
  if (!s || typeof s.id !== 'number') return null

  // artist(s): prefer `ar`/`artists`, accept both shapes
  let artistNames: string[] = []
  const ar = s.ar as Array<Record<string, unknown>> | undefined
  const artists = s.artists as Array<Record<string, unknown>> | undefined
  if (Array.isArray(ar) && ar.length) {
    artistNames = ar.map((a) => String(a?.name ?? '')).filter(Boolean)
  } else if (Array.isArray(artists) && artists.length) {
    artistNames = artists.map((a) => String(a?.name ?? '')).filter(Boolean)
  } else if (typeof s.name === 'string') {
    // some endpoints have flat `artist` string
    const flat = s.artists as unknown
    if (typeof flat === 'string') artistNames = [flat]
  }

  const al = s.al as Record<string, unknown> | undefined
  const album = s.album as Record<string, unknown> | undefined

  const picUrl = String(al?.picUrl || album?.picUrl || '')

  const duration = Number(s.dt ?? s.duration ?? 0)
  const fee = Number(s.fee ?? 0)

  return {
    id: s.id,
    name: String(s.name ?? '未知歌曲'),
    artists: artistNames.join(' / ') || '未知歌手',
    artistNames,
    album: String(al?.name ?? album?.name ?? '未知专辑'),
    albumId: Number(al?.id ?? album?.id ?? 0),
    picUrl,
    duration,
    fee,
    mvId: typeof s.mv === 'number' ? s.mv : typeof s.mvid === 'number' ? s.mvid : undefined,
  }
}

/** Enrich a list of raw songs via `/song/detail` (fills picUrl/ar/al uniformly). */
async function enrichSongs(ids: number[]): Promise<Map<number, Song>> {
  const map = new Map<number, Song>()
  if (!ids.length) return map
  const res = await request<SongDetailResponse>('/song/detail', {
    ids: ids.join(','),
  })
  for (const raw of res.songs ?? []) {
    const song = normalizeSong(raw)
    if (song) map.set(song.id, song)
  }
  return map
}

export async function searchSongs(keyword: string, limit = 40): Promise<Song[]> {
  const res = await request<SearchResponse>('/search', {
    keywords: keyword,
    limit,
    type: 1,
  })
  const raws = (res.result?.songs ?? []) as unknown[]
  // Try to enrich so every song has a cover image.
  const ids = raws
    .map((r) => normalizeSong(r)?.id)
    .filter((x): x is number => typeof x === 'number')
  const enriched = await enrichSongs(ids)
  return raws
    .map((r) => normalizeSong(r))
    .filter((s): s is Song => s !== null)
    .map((s) => enriched.get(s.id) ?? s)
}

/* ------------------------------------------------------------------ */
/*  Playback                                                           */
/* ------------------------------------------------------------------ */

export async function getSongUrl(
  id: number,
  level: 'standard' | 'higher' | 'exhigh' | 'lossless' = 'exhigh',
): Promise<{ url: string | null; br: number }> {
  const res = await request<SongUrlResponse>('/song/url/v1', { id, level })
  const d = res.data?.[0]
  return { url: d?.url ?? null, br: d?.br ?? 0 }
}

export async function getLyric(id: number): Promise<{
  lrc: string
  tlyric: string
  nolyric: boolean
}> {
  const res = await request<LyricResponse>('/lyric', { id })
  return {
    lrc: res.lrc?.lyric ?? '',
    tlyric: res.tlyric?.lyric ?? '',
    nolyric: !!res.nolyric,
  }
}

/* ------------------------------------------------------------------ */
/*  Discovery: charts / playlists / recommend / FM                     */
/* ------------------------------------------------------------------ */

export async function getTopSongs(type = 0, limit = 100): Promise<Song[]> {
  const res = await request<{ code?: number; data?: unknown[] }>('/top/song', {
    type,
  })
  const raws = (res.data ?? []).slice(0, limit) as unknown[]
  return raws
    .map((r) => normalizeSong(r))
    .filter((s): s is Song => s !== null)
}

export async function getPlaylistDetail(id: number): Promise<{
  name: string
  coverImgUrl: string
  songs: Song[]
}> {
  const res = await request<{ code?: number; playlist?: Record<string, unknown> }>(
    '/playlist/detail',
    { id },
  )
  const pl = res.playlist ?? {}
  const tracks = (pl.tracks ?? []) as unknown[]
  return {
    name: String(pl.name ?? '歌单'),
    coverImgUrl: String(pl.coverImgUrl ?? ''),
    songs: tracks
      .map((r) => normalizeSong(r))
      .filter((s): s is Song => s !== null),
  }
}

export async function getHotPlaylists(limit = 30): Promise<PlaylistInfo[]> {
  const res = await request<{ code?: number; playlists?: unknown[] }>(
    '/top/playlist',
    { limit, order: 'hot', cat: '全部' },
  )
  return (res.playlists ?? [])
    .map((p) => {
      const o = p as Record<string, unknown>
      return {
        id: Number(o.id),
        name: String(o.name ?? ''),
        coverImgUrl: String(o.coverImgUrl ?? ''),
        trackCount: Number(o.trackCount ?? 0),
        description: String(o.description ?? ''),
      }
    })
    .filter((p) => p.id > 0)
}

export async function getRecommendSongs(): Promise<Song[]> {
  const res = await request<{ code?: number; data?: { dailySongs?: unknown[] } }>(
    '/recommend/songs',
  )
  const raws = (res.data?.dailySongs ?? []) as unknown[]
  return raws
    .map((r) => normalizeSong(r))
    .filter((s): s is Song => s !== null)
}

export async function getPersonalFm(): Promise<Song[]> {
  const res = await request<{ code?: number; data?: unknown[] }>('/personal_fm')
  const raws = (res.data ?? []) as unknown[]
  return raws
    .map((r) => normalizeSong(r))
    .filter((s): s is Song => s !== null)
}

export async function fmTrash(id: number): Promise<void> {
  await request('/fm_trash', { id })
}

export async function getUserPlaylists(uid: number): Promise<PlaylistInfo[]> {
  const res = await request<{ code?: number; playlist?: unknown[] }>(
    '/user/playlist',
    { uid, limit: 50 },
  )
  return (res.playlist ?? [])
    .map((p) => {
      const o = p as Record<string, unknown>
      return {
        id: Number(o.id),
        name: String(o.name ?? ''),
        coverImgUrl: String(o.coverImgUrl ?? ''),
        trackCount: Number(o.trackCount ?? 0),
        description: String(o.description ?? ''),
      }
    })
    .filter((p) => p.id > 0)
}

/* ------------------------------------------------------------------ */
/*  Login (QR code)                                                    */
/* ------------------------------------------------------------------ */

export async function qrKey(): Promise<string> {
  const res = await request<QrKeyResponse>('/login/qr/key', {}, true)
  return res.data?.unikey ?? ''
}

export async function qrCreate(key: string): Promise<QrCreateResult> {
  const res = await request<QrCreateResponse>(
    '/login/qr/create',
    { key, qrimg: 'true', platform: 'web' },
    false,
  )
  return {
    qrimg: res.data?.qrimg ?? '',
    qrurl: res.data?.qrurl ?? '',
  }
}

export async function qrCheck(key: string): Promise<QrCheckResponse> {
  return request<QrCheckResponse>('/login/qr/check', { key, timestamp: Date.now() }, false)
}

export async function loginStatus(): Promise<UserProfile | null> {
  const res = await request<LoginStatusResponse>('/login/status')
  const profile = (res.data?.profile ?? res.profile ?? null) as Record<
    string,
    unknown
  > | null
  const account = (res.data?.account ?? res.account ?? null) as Record<
    string,
    unknown
  > | null
  if (!profile && !account) return null
  const accountVip = Number(account?.vipType ?? 0)
  const profileVip = Number(profile?.vipType ?? 0)
  return {
    userId: Number(profile?.userId ?? account?.id ?? 0),
    nickname: String(profile?.nickname ?? '网易云用户'),
    avatarUrl: String(profile?.avatarUrl ?? ''),
    signature: profile?.signature ? String(profile.signature) : undefined,
    vipType: Math.max(accountVip, profileVip),
  }
}

/* ------------------------------------------------------------------ */
/*  Like / red heart                                                   */
/* ------------------------------------------------------------------ */

export async function likeSong(id: number, like: boolean): Promise<void> {
  await request('/like', { id, like: like ? 'true' : 'false' }, false)
}

export async function getLikedIds(uid: number): Promise<number[]> {
  const res = await request<{ ids?: number[] }>('/likelist', { uid }, false)
  return res.ids ?? []
}

export interface VipInfo {
  vipType: number
  vipLevel: number
  /** milliseconds epoch; 0 = not a member */
  expireTime: number
}

export async function getVipInfo(uid: number): Promise<VipInfo> {
  const res = await request<{ data?: Record<string, unknown> }>(
    '/vip/info/v2',
    { uid },
    false,
  )
  const d = (res.data ?? {}) as Record<string, unknown>
  const redLevel = Number(d.redVipLevel ?? d.level ?? 0)
  const vipType = Number(
    d.vipType ?? d.redVipType ?? d.vipStatus ?? (redLevel > 0 ? 10 : 0),
  )
  const vipLevel = redLevel
  const expireTime = Number(d.redVipExpireTime ?? d.expireTime ?? 0)
  return { vipType, vipLevel, expireTime }
}

export async function getSongsByIds(ids: number[]): Promise<Song[]> {
  if (!ids.length) return []
  const res = await request<SongDetailResponse>('/song/detail', {
    ids: ids.join(','),
  })
  return (res.songs ?? [])
    .map((r) => normalizeSong(r))
    .filter((s): s is Song => s !== null)
}

export { API_BASE }
