import { Heart } from "lucide-react";
import { useExploreStore } from "../store/exploreStore";
import { sizedImage } from "../utils/image";
import { LoadingState, Page } from "./Page";
import SongList from "./SongList";
import BackButton from "./BackButton";

export default function ArtistPage() {
  const artist = useExploreStore((s) => s.artist);
  const songs = useExploreStore((s) => s.artistSongs);
  const albums = useExploreStore((s) => s.artistAlbums);
  const loading = useExploreStore((s) => s.loading);
  const toggleSubscription = useExploreStore((s) => s.toggleArtistSubscription);
  const openAlbum = useExploreStore((s) => s.openAlbum);

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
        </>
      )}
    </Page>
  );
}
