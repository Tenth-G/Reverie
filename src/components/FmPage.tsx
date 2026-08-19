import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import SongList from './SongList'
import { IconTrash } from './icons'

export default function FmPage() {
  const fmSongs = usePlayerStore((s) => s.fmSongs)
  const fmDislike = usePlayerStore((s) => s.fmDislike)

  return (
    <Page>
      <PageHeader
        title="私人FM"
        subtitle="无限播放你的专属电台"
        actions={
          <button className="btn" onClick={fmDislike} title="不喜欢当前歌曲">
            <IconTrash width={14} height={14} /> 不喜欢
          </button>
        }
      />
      <SongList songs={fmSongs} emptyText="登录后开启私人FM" />
    </Page>
  )
}
