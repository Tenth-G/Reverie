import { normalizeSong, request } from "./client.ts";
import type { Song } from "./types";

type Obj = Record<string, unknown>;

const obj = (value: unknown): Obj =>
  value && typeof value === "object" ? (value as Obj) : {};
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export interface ProfileDetail {
  userId: number;
  nickname: string;
  avatarUrl: string;
  backgroundUrl: string;
  signature: string;
  follows: number;
  followeds: number;
  playlistCount: number;
  eventCount: number;
  listenSongs: number;
  level: number;
  createTime: number;
}

export interface UserLevelInfo {
  level: number;
  progress: number;
  nowPlayCount: number;
  nextPlayCount: number;
  nowLoginCount: number;
  nextLoginCount: number;
}

export interface UserSubcount {
  artistCount: number;
  albumCount: number;
  mvCount: number;
  djRadioCount: number;
  createdPlaylistCount: number;
  subPlaylistCount: number;
}

export interface ListeningRecord {
  song: Song;
  playCount: number;
  score: number;
}

export interface ProfileCenterData {
  detail: ProfileDetail;
  level: UserLevelInfo;
  subcount: UserSubcount;
  records: ListeningRecord[];
}

function normalizeRecords(value: unknown): ListeningRecord[] {
  return arr(value)
    .map((raw) => {
      const record = obj(raw);
      const song = normalizeSong(record.song);
      return song
        ? {
            song,
            playCount: Number(record.playCount ?? 0),
            score: Number(record.score ?? 0),
          }
        : null;
    })
    .filter((record): record is ListeningRecord => record !== null);
}

export async function getListeningRecords(
  uid: number,
  period: "week" | "all",
): Promise<ListeningRecord[]> {
  const response = await request<Obj>("/user/record", {
    uid,
    type: period === "week" ? 1 : 0,
  });
  return normalizeRecords(
    period === "week" ? response.weekData : response.allData,
  );
}

export async function getProfileCenter(
  uid: number,
): Promise<ProfileCenterData> {
  const [detailResponse, levelResponse, subcountResponse, records] =
    await Promise.all([
      request<Obj>("/user/detail", { uid }),
      request<Obj>("/user/level", {}, false).catch(() => ({}) as Obj),
      request<Obj>("/user/subcount", {}, false).catch(() => ({}) as Obj),
      getListeningRecords(uid, "week").catch(() => []),
    ]);
  const profile = obj(detailResponse.profile);
  const levelData = obj(levelResponse.data);
  return {
    detail: {
      userId: Number(profile.userId ?? uid),
      nickname: String(profile.nickname ?? "网易云用户"),
      avatarUrl: String(profile.avatarUrl ?? ""),
      backgroundUrl: String(profile.backgroundUrl ?? ""),
      signature: String(profile.signature ?? ""),
      follows: Number(profile.follows ?? 0),
      followeds: Number(profile.followeds ?? 0),
      playlistCount: Number(profile.playlistCount ?? 0),
      eventCount: Number(profile.eventCount ?? 0),
      listenSongs: Number(detailResponse.listenSongs ?? 0),
      level: Number(detailResponse.level ?? levelData.level ?? 0),
      createTime: Number(detailResponse.createTime ?? profile.createTime ?? 0),
    },
    level: {
      level: Number(levelData.level ?? detailResponse.level ?? 0),
      progress: Number(levelData.progress ?? 0),
      nowPlayCount: Number(levelData.nowPlayCount ?? 0),
      nextPlayCount: Number(levelData.nextPlayCount ?? 0),
      nowLoginCount: Number(levelData.nowLoginCount ?? 0),
      nextLoginCount: Number(levelData.nextLoginCount ?? 0),
    },
    subcount: {
      artistCount: Number(subcountResponse.artistCount ?? 0),
      albumCount: Number(subcountResponse.albumCount ?? 0),
      mvCount: Number(subcountResponse.mvCount ?? 0),
      djRadioCount: Number(subcountResponse.djRadioCount ?? 0),
      createdPlaylistCount: Number(
        subcountResponse.createdPlaylistCount ?? profile.playlistCount ?? 0,
      ),
      subPlaylistCount: Number(subcountResponse.subPlaylistCount ?? 0),
    },
    records,
  };
}
