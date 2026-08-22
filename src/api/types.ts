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
  /** Present when the playable song represents a podcast program. */
  programId?: number;
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
  tags?: string[];
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
  replyCount: number;
  owner: boolean;
  userId: number;
  nickname: string;
  avatarUrl: string;
  repliedTo?: {
    userId: number;
    nickname: string;
    content: string;
  };
}

export type CommentResourceType =
  "song" | "mv" | "playlist" | "album" | "program" | "video" | "event";

export type CommentSort = "recommended" | "hot" | "new";

export interface CommentResource {
  type: CommentResourceType;
  id: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  threadId?: string;
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
  liked: boolean;
  resourceTitle?: string;
  resourceType?: "song" | "album" | "playlist" | "other";
  resourceId?: number;
  threadId?: string;
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
  | "search"
  | "profile"
  | "collection"
  | "notifications"
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
  | "social"
  | "cloud"
  | "yunbei"
  | "recommendHistory"
  | "vip"
  | "commentHistory";
  
  
  

export type SearchCategory =
  | "songs"
  | "lyrics"
  | "albums"
  | "artists"
  | "playlists"
  | "radios"
  | "users"
  | "mvs"
  | "videos";

export type CollectionCategory = "albums" | "artists" | "mvs" | "radios";

export interface SearchMediaInfo {
  id: string;
  name: string;
  coverUrl: string;
  creatorName: string;
  duration: number;
  playCount: number;
  kind: "mv" | "video";
}

export interface MediaDetail extends SearchMediaInfo {
  description: string;
  publishTime: number;
  tags: string[];
  artistIds: number[];
  commentCount: number;
  subCount: number;
}

export interface YunbeiTask {
  id: number;
  name: string;
  description: string;
  point: number;
  status: "todo" | "done" | "claimed";
  userTaskId?: number;
  depositCode?: string;
}

export interface YunbeiLedgerEntry {
  id: string;
  title: string;
  amount: number;
  time: number;
  type: "income" | "expense";
}

export interface YunbeiOverview {
  balance: number;
  todayEarned: number;
  signed: boolean;
  signDays: number;
}

export type RecentCategory = "songs" | "albums" | "playlists" | "radios" | "videos" | "voices";

export interface RecentAlbum {
  id: number;
  name: string;
  coverUrl: string;
  artistName: string;
  time: number;
}

export interface RecentPlaylist {
  id: number;
  name: string;
  coverUrl: string;
  creatorName: string;
  time: number;
}

export interface RecentRadio {
  id: number;
  name: string;
  coverUrl: string;
  creatorName: string;
  time: number;
}

export interface RecommendHistoryDay {
  date: string;
  displayDate: string;
  songCount: number;
}

export interface VipTask {
  id: string;
  name: string;
  description: string;
  reward: number;
  completed: boolean;
}

export interface VipGrowthInfo {
  level: number;
  growth: number;
  nextLevelGrowth: number;
  progress: number;
  expireTime: number;
}

export interface VipGrowthEntry {
  id: string;
  title: string;
  amount: number;
  time: number;
}

export interface UserCommentHistoryItem {
  id: number;
  content: string;
  time: number;
  resourceTitle: string;
  resourceType?: string;
  resourceId?: number;
}

export interface SearchResultPage {
  songs: Song[];
  albums: AlbumInfo[];
  artists: ArtistInfo[];
  playlists: PlaylistInfo[];
  radios: RadioInfo[];
  users: SocialUser[];
  media: SearchMediaInfo[];
  total: number;
  hasMore: boolean;
}

export interface CollectionResultPage {
  albums: AlbumInfo[];
  artists: ArtistInfo[];
  media: SearchMediaInfo[];
  radios: RadioInfo[];
  total: number;
  hasMore: boolean;
}

export interface CloudSong extends Song {
  cloudId: number;
  fileName: string;
  fileSize: number;
  bitrate: number;
  addTime: number;
  matchedSongId?: number;
}

export type NotificationCategory =
  "private" | "comments" | "mentions" | "notices";

export interface MessageUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
}

export interface PrivateConversation {
  user: MessageUser;
  preview: string;
  time: number;
  unreadCount: number;
}

export type PrivateAttachmentType = "song" | "playlist" | "album";

export interface PrivateAttachment {
  type: PrivateAttachmentType;
  id: number;
  title: string;
}

export interface PrivateMessage {
  id: string;
  fromUserId: number;
  toUserId: number;
  content: string;
  time: number;
  resourceTitle?: string;
  resourceType?: PrivateAttachmentType;
  resourceId?: number;
}

export interface NotificationItem {
  id: string;
  user: MessageUser | null;
  title: string;
  content: string;
  time: number;
  resourceTitle?: string;
}

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
