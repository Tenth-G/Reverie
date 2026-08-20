export interface Song {
  id: number
  name: string
  /** Joined artist names, e.g. "周杰伦" */
  artists: string
  artistNames: string[]
  album: string
  albumId: number
  picUrl: string
  /** duration in milliseconds */
  duration: number
  /** 0 = free, 1 = VIP, 4/8 = digital album etc. */
  fee: number
  mvId?: number
}

export interface LyricLine {
  time: number
  text: string
  translation?: string
}

export interface PlaylistInfo {
  id: number
  name: string
  coverImgUrl: string
  trackCount: number
  description?: string
}

export interface UserProfile {
  userId: number
  nickname: string
  avatarUrl: string
  signature?: string
  vipType: number
  badgeUrl?: string
}

export interface QrCreateResult {
  qrimg: string
  qrurl: string
}

export type PlayMode = 'sequence' | 'loop' | 'one' | 'shuffle'

export type View = 'home' | 'chart' | 'fm' | 'userlist' | 'playlist' | 'likes' | 'recent'

export interface SearchResponse {
  result?: { songs?: unknown[]; songCount?: number }
  code?: number
}

export interface SongDetailResponse {
  songs?: unknown[]
  code?: number
}

export interface LyricResponse {
  code?: number
  lrc?: { lyric?: string; version?: number }
  tlyric?: { lyric?: string; version?: number }
  nolyric?: boolean
}

export interface SongUrlResponse {
  code?: number
  data?: Array<{ id?: number; url?: string | null; br?: number; type?: string }>
}

export interface QrKeyResponse {
  code?: number
  data?: { unikey?: string }
}

export interface QrCreateResponse {
  code?: number
  data?: { qrimg?: string; qrurl?: string }
}

export interface QrCheckResponse {
  code?: number
  message?: string
  cookie?: string
  nickname?: string
  avatarUrl?: string
}

export interface LoginStatusResponse {
  code?: number
  data?: { code?: number; profile?: unknown; account?: unknown }
  profile?: unknown
  account?: unknown
}
