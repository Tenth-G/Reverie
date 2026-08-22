import { useEffect, useState } from "react";
import { Award, BookOpen, Search, Sparkles } from "lucide-react";
import { useUgcStore } from "../store/ugcStore.ts";
import { LoadingState, Page, PageHeader } from "./Page";
export default function UgcPage() {
  const resource = useUgcStore((s) => s.resource);
  const results = useUgcStore((s) => s.results);
  const contributions = useUgcStore((s) => s.contributions);
  const devote = useUgcStore((s) => s.devote);
  const loading = useUgcStore((s) => s.loading);
  const error = useUgcStore((s) => s.error);
  const lookup = useUgcStore((s) => s.lookup);
  const searchArtist = useUgcStore((s) => s.searchArtist);
  const load = useUgcStore((s) => s.load);
  const [kind, setKind] = useState<"song" | "album" | "artist" | "mv">("song");
  const [id, setId] = useState("");
  const [keyword, setKeyword] = useState("");
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page>
      <PageHeader
        title="百科贡献"
        subtitle="查询歌曲、专辑、歌手与 MV 百科信息，查看贡献记录"
        actions={<BookOpen size={18} />}
      />
      <section className="ugc-lookup">
        <div className="ugc-selects">
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as typeof kind)}
          >
            <option value="song">歌曲</option>
            <option value="album">专辑</option>
            <option value="artist">歌手</option>
            <option value="mv">MV</option>
          </select>
          <input
            value={id}
            inputMode="numeric"
            onChange={(event) => setId(event.target.value)}
            placeholder="资源 ID"
          />
          <button
            className="primary-button"
            onClick={() => void lookup(kind, Number(id))}
          >
            <Search size={15} />
            查询
          </button>
        </div>
        <div className="ugc-selects">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索歌手"
            onKeyDown={(event) => {
              if (event.key === "Enter") void searchArtist(keyword);
            }}
          />
          <button
            className="secondary-button"
            onClick={() => void searchArtist(keyword)}
          >
            <Search size={15} />
            搜索
          </button>
        </div>
      </section>
      {loading ? (
        <LoadingState label="正在加载百科数据…" />
      ) : (
        <>
          {resource && (
            <section className="ugc-resource">
              <Sparkles size={18} />
              <div>
                <h2>{resource.name}</h2>
                <p>{resource.description || "暂无说明"}</p>
                <small>{resource.extra}</small>
              </div>
            </section>
          )}
          {results.length > 0 && (
            <section className="ugc-section">
              <h2>歌手搜索结果</h2>
              <div className="ugc-results">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setKind("artist");
                      setId(String(item.id));
                      void lookup("artist", item.id);
                    }}
                  >
                    {item.name}
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
          <section className="ugc-section">
            <div className="ugc-section-head">
              <h2>
                <Award size={16} />
                我的贡献
              </h2>
              <span>{contributions.length} 条</span>
            </div>
            {devote && (
              <div className="ugc-devote">
                <span>
                  贡献次数 <b>{devote.count}</b>
                </span>
                <span>
                  积分 <b>{devote.points}</b>
                </span>
                <span>
                  云贝 <b>{devote.yunbei}</b>
                </span>
              </div>
            )}
            {contributions.map((item) => (
              <div className="ugc-contribution" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description || `类型 ${item.type}`}</span>
                </div>
                <b>{item.status || "处理中"}</b>
              </div>
            ))}
          </section>
        </>
      )}
      {error && (
        <div className="ugc-error" role="alert">
          {error}
        </div>
      )}
    </Page>
  );
}
