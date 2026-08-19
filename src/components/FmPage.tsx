import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import SongList from './SongList'
import { IconRefresh } from './icons'

export default function FmPage() {
  const fmSongs = usePlayerStore((s) => s.fmSongs)
  const loadPersonalFm = usePlayerStore((s) => s.loadPersonalFm)

  return (
    <Page>
      <PageHeader
        title="漫游"
        subtitle="随机播放歌曲，换一批听听"
        actions={
          <button className="btn" onClick={loadPersonalFm}>
            <IconRefresh width={14} height={14} /> 换一批
          </button>
        }
      />
      <SongList songs={fmSongs} emptyText="登录后开启漫游随机播放" />
    </Page>
  )
}
