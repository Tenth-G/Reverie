import { normalizeSong, request } from "./client.ts";
import type {
  AlbumInfo,
  ArtistInfo,
  PlaylistInfo,
  RadioInfo,
  SearchCategory,
  SearchMediaInfo,
  SearchResultPage,
  SearchSuggestion,
  SocialUser,
} from "./types";

type Obj = Record<string, unknown>;

const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const SEARCH_TYPE: Record<SearchCategory, number> = {
  songs: 1,
  lyrics: 1006,
  albums: 10,
  artists: 100,
  playlists: 1000,
  users: 1002,
  mvs: 1004,
  radios: 1009,
  videos: 1014,
};

function normalizeAlbum(raw: unknown): AlbumInfo {
  const value = obj(raw);
  const artistList = arr(value.artists).map(obj);
  const artist = obj(value.artist);
  const artists = artistList.length ? artistList : artist.id ? [artist] : [];
  return {
    id: Number(value.id ?? 0),
    name: String(value.name ?? "未知专辑"),
    picUrl: String(value.picUrl ?? value.blurPicUrl ?? ""),
    artistNames: artists
      .map((item) => String(item.name ?? ""))
      .filter(Boolean)
      .join(" / "),
    artistIds: artists
      .map((item) => Number(item.id ?? 0))
      .filter((id) => id > 0),
    description: String(value.description ?? value.briefDesc ?? ""),
    publishTime: Number(value.publishTime ?? 0),
    size: Number(value.size ?? value.containedSongCount ?? 0),
    subscribed: Boolean(value.subscribed ?? value.isSub),
  };
}

function normalizeArtist(raw: unknown): ArtistInfo {
  const value = obj(raw);
  return {
    id: Number(value.id ?? 0),
    name: String(value.name ?? "未知歌手"),
    picUrl: String(value.picUrl ?? value.img1v1Url ?? ""),
    alias: arr(value.alias).map(String),
    briefDesc: String(value.briefDesc ?? ""),
    followed: Boolean(value.followed ?? value.follow),
    musicSize: Number(value.musicSize ?? 0),
    albumSize: Number(value.albumSize ?? 0),
  };
}

function normalizePlaylist(raw: unknown): PlaylistInfo {
  const value = obj(raw);
  const creator = obj(value.creator);
  return {
    id: Number(value.id ?? 0),
    name: String(value.name ?? "歌单"),
    coverImgUrl: String(value.coverImgUrl ?? ""),
    trackCount: Number(value.trackCount ?? 0),
    description: String(value.description ?? ""),
    creatorId: Number(creator.userId ?? 0),
    creatorName: String(creator.nickname ?? ""),
    subscribed: Boolean(value.subscribed),
    privacy: Number(value.privacy ?? 0),
  };
}

function normalizeRadio(raw: unknown): RadioInfo {
  const value = obj(raw);
  const dj = obj(value.dj);
  return {
    id: Number(value.id ?? 0),
    name: String(value.name ?? "播客"),
    picUrl: String(value.picUrl ?? value.intervenePicUrl ?? ""),
    description: String(value.desc ?? value.description ?? ""),
    programCount: Number(value.programCount ?? 0),
    subscriberCount: Number(value.subCount ?? value.subscriberCount ?? 0),
    subscribed: Boolean(value.subed ?? value.subscribed),
    category: String(value.category ?? value.categoryName ?? ""),
    djName: String(dj.nickname ?? ""),
  };
}

function normalizeUser(raw: unknown): SocialUser {
  const value = obj(raw);
  return {
    userId: Number(value.userId ?? value.id ?? 0),
    nickname: String(value.nickname ?? "网易云用户"),
    avatarUrl: String(value.avatarUrl ?? ""),
    signature: String(value.signature ?? ""),
    followed: Boolean(value.followed ?? value.mutual),
    follows: Number(value.follows ?? 0),
    followeds: Number(value.followeds ?? 0),
  };
}

function normalizeMedia(raw: unknown, kind: "mv" | "video"): SearchMediaInfo {
  const value = obj(raw);
  const creator = obj(value.creator);
  const artists = arr(value.artists).map(obj);
  return {
    id: String(value.id ?? value.vid ?? ""),
    name: String(value.name ?? value.title ?? "未命名视频"),
    coverUrl: String(value.cover ?? value.coverUrl ?? value.imgurl ?? ""),
    creatorName: String(
      value.artistName ??
        creator.nickname ??
        artists
          .map((item) => String(item.name ?? ""))
          .filter(Boolean)
          .join(" / "),
    ),
    duration: Number(value.duration ?? value.durationms ?? 0),
    playCount: Number(value.playCount ?? value.playTime ?? 0),
    kind,
  };
}

export async function searchContent(
  keyword: string,
  category: SearchCategory,
  limit = 30,
  offset = 0,
): Promise<SearchResultPage> {
  const response = await request<Obj>("/cloudsearch", {
    keywords: keyword,
    type: SEARCH_TYPE[category],
    limit,
    offset,
  });
  const result = obj(response.result);
  const songs = arr(result.songs)
    .map(normalizeSong)
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const albums = arr(result.albums)
    .map(normalizeAlbum)
    .filter((item) => item.id > 0);
  const artists = arr(result.artists)
    .map(normalizeArtist)
    .filter((item) => item.id > 0);
  const playlists = arr(result.playlists)
    .map(normalizePlaylist)
    .filter((item) => item.id > 0);
  const radios = arr(result.djRadios)
    .map(normalizeRadio)
    .filter((item) => item.id > 0);
  const users = arr(result.userprofiles)
    .map(normalizeUser)
    .filter((item) => item.userId > 0);
  const media = (category === "mvs" ? arr(result.mvs) : arr(result.videos))
    .map((item) => normalizeMedia(item, category === "mvs" ? "mv" : "video"))
    .filter((item) => item.id);
  const totalKey: Record<SearchCategory, string> = {
    songs: "songCount",
    lyrics: "songCount",
    albums: "albumCount",
    artists: "artistCount",
    playlists: "playlistCount",
    radios: "djRadiosCount",
    users: "userprofileCount",
    mvs: "mvCount",
    videos: "videoCount",
  };
  const total = Number(result[totalKey[category]] ?? 0);
  return {
    songs,
    albums,
    artists,
    playlists,
    radios,
    users,
    media,
    total,
    hasMore: offset + limit < total,
  };
}

export async function getHotSearchTerms(limit = 20): Promise<string[]> {
  const response = await request<Obj>("/search/hot/detail", {}, false);
  return arr(response.data)
    .map((item) => String(obj(item).searchWord ?? ""))
    .filter(Boolean)
    .slice(0, limit);
}

export async function getDefaultSearchKeyword(): Promise<string> {
  const response = await request<Obj>("/search/default", {}, false);
  const value = obj(response.data ?? response.result ?? response);
  return String(value.showKeyword ?? value.realkeyword ?? value.keyword ?? "");
}

export async function getSearchSuggestions(keyword: string): Promise<SearchSuggestion[]> {
  const value = keyword.trim();
  if (!value) return [];
  const response = await request<Obj>("/search/suggest", { keywords: value, type: "web" }, false);
  const data = obj(response.result ?? response.data ?? response);
  return arr(data.allMatch ?? data.songs ?? data.playlists ?? response.result ?? response.data)
    .map((raw) => {
      const item = obj(raw);
      return {
        keyword: String(item.keyword ?? item.name ?? item.albumName ?? ""),
        type: String(item.type ?? item.resourceType ?? "歌曲"),
        source: String(item.source ?? item.albumName ?? item.artistName ?? ""),
      } satisfies SearchSuggestion;
    })
    .filter((item) => item.keyword);
}

export async function getSearchMediaUrl(
  item: SearchMediaInfo,
): Promise<string> {
  if (item.kind === "mv") {
    const response = await request<Obj>(
      "/mv/url",
      { id: item.id, r: 1080 },
      false,
    );
    return String(obj(response.data).url ?? "");
  }
  const response = await request<Obj>(
    "/video/url",
    { id: item.id, resolutions: 1080 },
    false,
  );
  return String(obj(arr(response.urls)[0]).url ?? "");
}
