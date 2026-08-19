import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import PlaylistGrid from './PlaylistGrid'

export default function UserListPage() {
  const userPlaylists = usePlayerStore((s) => s.userPlaylists)
  const openPlaylist = usePlayerStore((s) => s.openPlaylist)

  return (
    <Page>
      <PageHeader title="我的歌单" subtitle="我创建 / 收藏的歌单" />
      <PlaylistGrid
        playlists={userPlaylists}
        onOpen={openPlaylist}
        emptyText="登录后查看「我创建 / 收藏的歌单」"
      />
    </Page>
  )
}
