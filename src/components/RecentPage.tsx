import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import SongList from './SongList'

export default function RecentPage() {
  const recentSongs = usePlayerStore((s) => s.recentSongs)

  return (
    <Page>
      <PageHeader title="最近播放" subtitle={`${recentSongs.length} 首`} />
      <SongList songs={recentSongs} emptyText="暂无播放记录" />
    </Page>
  )
}
