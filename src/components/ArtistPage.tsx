import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getSimilarArtists } from "../api/related";
import type { ArtistInfo } from "../api/types";
import { useExploreStore } from "../store/exploreStore";
import { useMediaStore } from "../store/mediaStore.ts";
import { sizedImage } from "../utils/image";
import { LoadingState, Page } from "./Page";
import SongList from "./SongList";
import BackButton from "./BackButton";

export default function ArtistPage() {
  const artist = useExploreStore((s) => s.artist);
  const songs = useExploreStore((s) => s.artistSongs);
  const albums = useExploreStore((s) => s.artistAlbums);
  const videos = useExploreStore((s) => s.artistVideos);
  const loading = useExploreStore((s) => s.loading);
  const toggleSubscription = useExploreStore((s) => s.toggleArtistSubscription);
  const openAlbum = useExploreStore((s) => s.openAlbum);
  const openMedia = useMediaStore((s) => s.open);
  const openArtist = useExploreStore((s) => s.openArtist);
  const [similarArtists, setSimilarArtists] = useState<ArtistInfo[]>([]);

  useEffect(() => {
    let alive = true;
    if (!artist?.id) {
      setSimilarArtists([]);
      return;
    }
    void getSimilarArtists(artist.id)
      .then((items) => {
        if (alive) setSimilarArtists(items.slice(0, 12));
      })
      .catch(() => {
        if (alive) setSimilarArtists([]);
      });
    return () => {
      alive = false;
    };
  }, [artist?.id]);

  return (
    <Page>
      {!artist ? (
        loading ? (
          <LoadingState label="正在加载歌手…" />
        ) : (
          <div className="empty">歌手不存在</div>
        )
      ) : (
        <>
          <BackButton />
          <section className="detail-hero artist-hero">
            <img
              className="detail-cover round"
              src={sizedImage(artist.picUrl, 480)}
              alt=""
            />
            <div className="detail-copy">
              <span className="detail-kind">歌手</span>
              <h1>{artist.name}</h1>
              {artist.alias.length > 0 && (
                <div className="detail-alias">{artist.alias.join(" / ")}</div>
              )}
              <p>{artist.briefDesc || "暂无歌手介绍"}</p>
              <div className="detail-meta">
                <span>{artist.musicSize || songs.length} 首歌曲</span>
                <span>{artist.albumSize || albums.length} 张专辑</span>
              </div>
              <div className="detail-actions">
                <button
                  className={`btn ${artist.followed ? "active" : "primary"}`}
                  onClick={() => void toggleSubscription()}
                >
                  <Heart
                    size={15}
                    fill={artist.followed ? "currentColor" : "none"}
                  />
                  {artist.followed ? "已收藏" : "收藏歌手"}
                </button>
              </div>
            </div>
          </section>
          <SongList songs={songs} title="热门歌曲" />
          <div className="list-header">
            <h3>专辑</h3>
            <span className="count">{albums.length} 张</span>
          </div>
          <div className="media-grid compact">
            {albums.map((album) => (
              <button
                className="media-card"
                key={album.id}
                onClick={() => void openAlbum(album.id)}
              >
                <div className="card-cover">
                  <img
                    src={sizedImage(album.picUrl, 320)}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <strong>{album.name}</strong>
                <span>
                  {album.publishTime
                    ? new Date(album.publishTime).getFullYear()
                    : ""}
                </span>
              </button>
            ))}
          </div>
          {videos.length > 0 && (
            <>
              <div className="list-header">
                <h3>相关视频</h3>
                <span className="count">{videos.length} 个</span>
              </div>
              <div className="media-grid compact">
                {videos.map((video) => (
                  <button
                    className="media-card"
                    key={video.id}
                    onClick={() => void openMedia(video)}
                  >
                    <div className="card-cover">
                      <img src={sizedImage(video.coverUrl, 320)} alt="" />
                    </div>
                    <strong>{video.name}</strong>
                    <span>{video.creatorName || "视频"}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {similarArtists.length > 0 && (
            <>
              <div className="list-header">
                <h3>相似歌手</h3>
                <span className="count">{similarArtists.length} 位</span>
              </div>
              <div className="media-grid compact">
                {similarArtists.map((item) => (
                  <button
                    className="media-card"
                    key={item.id}
                    onClick={() => void openArtist(item.id)}
                  >
                    <div className="card-cover">
                      <img src={sizedImage(item.picUrl, 320)} alt="" loading="lazy" />
                    </div>
                    <strong>{item.name}</strong>
                    <span>{item.musicSize ? `${item.musicSize} 首歌曲` : "歌手"}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Page>
  );
}
