import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import SongList from './SongList'

export default function SearchResults() {
  const searchKeyword = usePlayerStore((s) => s.searchKeyword)
  const searching = usePlayerStore((s) => s.searching)
  const searchResults = usePlayerStore((s) => s.searchResults)

  return (
    <Page>
      <PageHeader
        title="搜索结果"
        subtitle={searchKeyword ? `关键词：${searchKeyword}` : '输入关键词搜索'}
      />
      {searching ? (
        <div className="loading-hint">搜索中…</div>
      ) : (
        <SongList
          songs={searchResults}
          emptyText={searchKeyword ? '没有找到相关歌曲' : '在右上角输入关键词搜索'}
        />
      )}
    </Page>
  )
}
