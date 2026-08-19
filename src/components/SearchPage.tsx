import { usePlayerStore } from '../store/playerStore'
import { Page, PageHeader } from './Page'
import SongList from './SongList'
import { IconSearch } from './icons'

export default function SearchPage() {
  const searchKeyword = usePlayerStore((s) => s.searchKeyword)
  const searching = usePlayerStore((s) => s.searching)
  const searchResults = usePlayerStore((s) => s.searchResults)
  const doSearch = usePlayerStore((s) => s.doSearch)

  return (
    <Page>
      <PageHeader title="搜索" subtitle="搜索歌曲 / 歌手 / 专辑" />
      <div className="search-box page-search">
        <input
          autoFocus
          placeholder="搜索歌曲 / 歌手 / 专辑…"
          value={searchKeyword}
          onChange={(e) => usePlayerStore.setState({ searchKeyword: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') doSearch(e.currentTarget.value)
          }}
        />
        <button className="btn primary" onClick={() => doSearch(searchKeyword)}>
          <IconSearch width={15} height={15} /> 搜索
        </button>
      </div>
      {searching ? (
        <div className="loading-hint">搜索中…</div>
      ) : (
        <SongList
          songs={searchResults}
          emptyText={
            searchKeyword ? '没有找到相关歌曲' : '输入关键词，回车或点击搜索'
          }
        />
      )}
    </Page>
  )
}
