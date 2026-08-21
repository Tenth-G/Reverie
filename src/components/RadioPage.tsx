import { useEffect } from "react";
import { Heart } from "lucide-react";
import type { RadioInfo } from "../api/types";
import { useExploreStore } from "../store/exploreStore";
import { sizedImage } from "../utils/image";
import { LoadingState, Page, PageHeader } from "./Page";

function RadioGrid({ radios }: { radios: RadioInfo[] }) {
  const openRadio = useExploreStore((s) => s.openRadio);
  const toggleSubscription = useExploreStore((s) => s.toggleRadioSubscription);
  return (
    <div className="media-grid">
      {radios.map((radio) => (
        <article
          className="media-card"
          key={radio.id}
          onClick={() => void openRadio(radio.id)}
        >
          <div className="card-cover">
            <img src={sizedImage(radio.picUrl, 360)} alt="" loading="lazy" />
            <button
              className={`media-favorite ${radio.subscribed ? "active" : ""}`}
              title={radio.subscribed ? "取消订阅" : "订阅电台"}
              onClick={(e) => {
                e.stopPropagation();
                void toggleSubscription(radio);
              }}
            >
              <Heart
                size={15}
                fill={radio.subscribed ? "currentColor" : "none"}
              />
            </button>
          </div>
          <strong>{radio.name}</strong>
          <span>
            {radio.category || radio.djName || `${radio.programCount} 期`}
          </span>
        </article>
      ))}
    </div>
  );
}

export default function RadioPage() {
  const radios = useExploreStore((s) => s.radios);
  const subscribed = useExploreStore((s) => s.subscribedRadios);
  const loading = useExploreStore((s) => s.loading);
  const loadRadios = useExploreStore((s) => s.loadRadios);

  useEffect(() => {
    void loadRadios();
  }, [loadRadios]);

  return (
    <Page>
      <PageHeader
        title="播客与电台"
        subtitle="精选节目、声音内容和已订阅电台"
      />
      {subscribed.length > 0 && (
        <section className="content-section">
          <div className="list-header">
            <h3>我的订阅</h3>
            <span className="count">{subscribed.length} 个</span>
          </div>
          <RadioGrid radios={subscribed} />
        </section>
      )}
      <section className="content-section">
        <div className="list-header">
          <h3>精选推荐</h3>
          <span className="count">{radios.length} 个</span>
        </div>
        {radios.length ? (
          <RadioGrid radios={radios} />
        ) : loading ? (
          <LoadingState label="正在加载播客与电台…" />
        ) : (
          <div className="empty">暂无推荐电台</div>
        )}
      </section>
    </Page>
  );
}
