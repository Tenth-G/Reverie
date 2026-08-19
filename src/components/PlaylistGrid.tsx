import type { PlaylistInfo } from '../api/types'

interface Props {
  playlists: PlaylistInfo[]
  onOpen: (id: number, name: string) => void
  emptyText?: string
}

export default function PlaylistGrid({ playlists, onOpen, emptyText = '暂无歌单' }: Props) {
  if (!playlists.length) {
    return (
      <div className="list-panel">
        <div className="list-header">
          <h3>歌单</h3>
        </div>
        <div className="empty">{emptyText}</div>
      </div>
    )
  }
  return (
    <div className="list-panel">
      <div className="list-header">
        <h3>歌单</h3>
        <span className="count">{playlists.length} 个</span>
      </div>
      <div className="playlist-grid">
        {playlists.map((p) => (
          <div key={p.id} className="playlist-card" onClick={() => onOpen(p.id, p.name)}>
            <img src={p.coverImgUrl} alt="" loading="lazy" />
            <div className="n">{p.name}</div>
            <div className="c">{p.trackCount} 首</div>
          </div>
        ))}
      </div>
    </div>
  )
}
