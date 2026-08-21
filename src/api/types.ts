export interface Song {
  id: number;
  name: string;
  /** Joined artist names, e.g. "周杰伦" */
  artists: string;
  artistNames: string[];
  artistIds?: number[];
  album: string;
  albumId: number;
  picUrl: string;
  /** duration in milliseconds */
  duration: number;
  /** 0 = free, 1 = VIP, 4/8 = digital album etc. */
  fee: number;
  mvId?: number;
}

export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

export interface PlaylistInfo {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  description?: string;
  creatorId?: number;
  creatorName?: string;
  subscribed?: boolean;
  privacy?: number;
}

export interface ArtistInfo {
  id: number;
  name: string;
  picUrl: string;
  alias: string[];
  briefDesc: string;
  followed: boolean;
  musicSize: number;
  albumSize: number;
}

export interface AlbumInfo {
  id: number;
  name: string;
  picUrl: string;
  artistNames: string;
  artistIds: number[];
  description: string;
  publishTime: number;
  size: number;
  subscribed: boolean;
}

export interface CommentInfo {
  id: number;
  content: string;
  time: number;
  liked: boolean;
  likedCount: number;
  userId: number;
  nickname: string;
  avatarUrl: string;
}

export interface RadioInfo {
  id: number;
  name: string;
  picUrl: string;
  description: string;
  programCount: number;
  subscriberCount: number;
  subscribed: boolean;
  category: string;
  djName: string;
}

export interface SocialUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature: string;
  followed: boolean;
  follows: number;
  followeds: number;
}

export interface SocialEvent {
  id: number;
  type: number;
  time: number;
  text: string;
  user: SocialUser;
  commentCount: number;
  forwardCount: number;
  likedCount: number;
  resourceTitle?: string;
  resourceType?: "song" | "album" | "playlist" | "other";
  resourceId?: number;
}

export interface UserProfile {
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature?: string;
  vipType: number;
  badgeUrl?: string;
}

export interface QrCreateResult {
  qrimg: string;
  qrurl: string;
}

export type PlayMode = "sequence" | "one" | "shuffle";

export type View =
  | "home"
  | "chart"
  | "fm"
  | "userlist"
  | "playlist"
  | "likes"
  | "recent"
  | "album"
  | "artist"
  | "comments"
  | "radio"
  | "radioDetail"
  | "social";

export interface SearchResponse {
  result?: { songs?: unknown[]; songCount?: number };
  code?: number;
}

export interface SongDetailResponse {
  songs?: unknown[];
  code?: number;
}

export interface LyricResponse {
  code?: number;
  lrc?: { lyric?: string; version?: number };
  tlyric?: { lyric?: string; version?: number };
  nolyric?: boolean;
}

export interface SongUrlResponse {
  code?: number;
  data?: Array<{
    id?: number;
    url?: string | null;
    br?: number;
    type?: string;
  }>;
}

export interface QrKeyResponse {
  code?: number;
  data?: { unikey?: string };
}

export interface QrCreateResponse {
  code?: number;
  data?: { qrimg?: string; qrurl?: string };
}

export interface QrCheckResponse {
  code?: number;
  message?: string;
  cookie?: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface LoginStatusResponse {
  code?: number;
  data?: { code?: number; profile?: unknown; account?: unknown };
  profile?: unknown;
  account?: unknown;
}
