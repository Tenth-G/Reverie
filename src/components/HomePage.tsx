import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import PlaylistGrid from './PlaylistGrid'
import SongList from './SongList'
import SongCards from './SongCards'

export default function HomePage() {
  const hotPlaylists = usePlayerStore((s) => s.hotPlaylists)
  const topSongs = usePlayerStore((s) => s.topSongs)
  const recommendSongs = usePlayerStore((s) => s.recommendSongs)
  const openPlaylist = usePlayerStore((s) => s.openPlaylist)
  const loadTopSongs = usePlayerStore((s) => s.loadTopSongs)

  return (
    <Page>
      <PageHeader title="首页" subtitle="发现好音乐" />

      <section className="home-section">
        <div className="section-title">
          <h2>每日推荐</h2>
        </div>
        <SongCards songs={recommendSongs.slice(0, 12)} />
      </section>

      <section className="home-section">
        <div className="section-title">
          <h2>推荐歌单</h2>
        </div>
        <PlaylistGrid
          playlists={hotPlaylists.slice(0, 10)}
          onOpen={openPlaylist}
          emptyText={hotPlaylists.length ? '暂无歌单' : '加载中…'}
        />
      </section>

      <section className="home-section">
        <div className="section-title">
          <h2>排行榜 · 飙升榜</h2>
          <button className="link-btn" onClick={loadTopSongs}>
            更多 →
          </button>
        </div>
        <SongList songs={topSongs.slice(0, 10)} emptyText="加载中…" />
      </section>
    </Page>
  )
}
