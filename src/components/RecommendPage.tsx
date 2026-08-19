import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import SongList from './SongList'

export default function RecommendPage() {
  const recommendSongs = usePlayerStore((s) => s.recommendSongs)
  const recommendLoading = usePlayerStore((s) => s.recommendLoading)

  return (
    <Page>
      <PageHeader title="每日推荐" subtitle="根据你的口味每日更新" />
      <SongList
        songs={recommendSongs}
        emptyText={recommendLoading ? '加载中…' : '登录后查看每日推荐'}
      />
    </Page>
  )
}
