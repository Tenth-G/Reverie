import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import PlaylistGrid from './PlaylistGrid'
import SongList from './SongList'

export default function PlaylistPage() {
  const hotPlaylists = usePlayerStore((s) => s.hotPlaylists)
  const hotPlaylistsLoading = usePlayerStore((s) => s.hotPlaylistsLoading)
  const playlistSongs = usePlayerStore((s) => s.playlistSongs)
  const playlistName = usePlayerStore((s) => s.playlistName)
  const openPlaylist = usePlayerStore((s) => s.openPlaylist)
  const closePlaylist = usePlayerStore((s) => s.closePlaylist)

  if (playlistSongs.length || playlistName) {
    return (
      <Page>
        <PageHeader
          title={playlistName}
          subtitle={`${playlistSongs.length} 首`}
          actions={
            <button className="btn" onClick={closePlaylist}>
              ← 返回歌单
            </button>
          }
        />
        <SongList songs={playlistSongs} />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title="推荐歌单" subtitle="热门歌单" />
      <PlaylistGrid
        playlists={hotPlaylists}
        onOpen={openPlaylist}
        emptyText={hotPlaylistsLoading ? '加载中…' : '暂无歌单'}
      />
    </Page>
  )
}
