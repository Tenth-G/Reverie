import { usePlayerStore } from "../store/playerStore";
import { Page, PageHeader } from "./Page";
import SongList from "./SongList";
import { RefreshCw } from "lucide-react";

export default function FmPage() {
  const fmSongs = usePlayerStore((s) => s.fmSongs);
  const loadPersonalFm = usePlayerStore((s) => s.loadPersonalFm);

  return (
    <Page>
      <PageHeader
        title="漫游"
        subtitle="网易云私人 FM，根据你的听歌偏好持续推荐"
        actions={
          <button className="btn" onClick={loadPersonalFm}>
            <RefreshCw size={14} /> 换一批
          </button>
        }
      />
      <SongList songs={fmSongs} emptyText="登录后开启私人漫游" />
    </Page>
  );
}
