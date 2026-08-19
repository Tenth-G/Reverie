import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import SongList from './SongList'

export default function LikesPage() {
  const likedSongs = usePlayerStore((s) => s.likedSongs)
  const loadLikedSongs = usePlayerStore((s) => s.loadLikedSongs)

  return (
    <Page>
      <PageHeader
        title="我的喜欢"
        subtitle={`${likedSongs.length} 首红心歌曲`}
        actions={
          <button className="btn" onClick={loadLikedSongs}>
            刷新
          </button>
        }
      />
      <SongList songs={likedSongs} emptyText="还没有喜欢的歌曲，点播放栏的红心收藏吧" />
    </Page>
  )
}
