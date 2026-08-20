import { useEffect, useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import { Page } from "./Page";
import PlaylistGrid from "./PlaylistGrid";
import SongList from "./SongList";
import SongCards from "./SongCards";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const MUNICIPALITIES = ["北京", "上海", "天津", "重庆"];

async function fetchLocation(): Promise<string> {
  // ipip.net returns Chinese location text: "来自于：中国 江苏 连云港  移动"
  try {
    const res = await fetch("https://myip.ipip.net", {
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    const m = text.match(/来自于：(\S+)\s+(\S+)\s+(\S+)/);
    if (m) {
      const country = m[1];
      const province = m[2];
      const city = m[3];
      if (country === "中国") {
        if (MUNICIPALITIES.includes(province)) return `${province}市`;
        return city.endsWith("市")
          ? `${province}省${city}`
          : `${province}省${city}市`;
      }
      return [country, province, city].filter(Boolean).join(" ");
    }
  } catch {
    /* fall through */
  }
  // fallback
  try {
    const res = await fetch("https://ipinfo.io/json", {
      signal: AbortSignal.timeout(8000),
    });
    const j = await res.json();
    const city = String(j.city ?? "");
    const region = String(j.region ?? "");
    return [region, city].filter(Boolean).join(" ");
  } catch {
    return "";
  }
}

export default function HomePage() {
  const hotPlaylists = usePlayerStore((s) => s.hotPlaylists);
  const topSongs = usePlayerStore((s) => s.topSongs);
  const recommendSongs = usePlayerStore((s) => s.recommendSongs);
  const homeQuote = usePlayerStore((s) => s.homeQuote);
  const openPlaylist = usePlayerStore((s) => s.openPlaylist);
  const loadTopSongs = usePlayerStore((s) => s.loadTopSongs);

  const [now, setNow] = useState(() => new Date());
  const [location, setLocation] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchLocation().then(setLocation);
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 星期${WEEKDAYS[now.getDay()]}`;
  const hour = now.getHours();
  const greeting =
    hour < 6
      ? "夜深了"
      : hour < 12
        ? "上午好"
        : hour < 18
          ? "下午好"
          : "晚上好";

  return (
    <Page>
      <div className="home-hero">
        <div className="hero-left">
          <div className="hero-time">
            {hh}:{mm}
          </div>
          <div className="hero-meta">
            <span>
              {greeting} · {dateStr}
            </span>
            {location && <span className="hero-loc">{location}</span>}
          </div>
        </div>
        <div className="hero-right">
          {homeQuote ? (
            <blockquote className="hero-quote">
              <p>“{homeQuote.text}”</p>
              <cite>—— {homeQuote.source}</cite>
            </blockquote>
          ) : (
            <div className="hero-quote-empty">正在为你挑选一句歌词…</div>
          )}
        </div>
      </div>

      <section className="home-section">
        <div className="section-title">
          <h2>每日推荐</h2>
        </div>
        <SongCards songs={recommendSongs.slice(0, 12)} />
      </section>

      <section className="home-section">
        <div className="section-title">
          <h2>推荐歌单</h2>
        </div>
        <PlaylistGrid
          playlists={hotPlaylists.slice(0, 10)}
          onOpen={openPlaylist}
          emptyText={hotPlaylists.length ? "暂无歌单" : "加载中…"}
        />
      </section>

      <section className="home-section">
        <div className="section-title">
          <h2>排行榜 · 飙升榜</h2>
          <button className="link-btn" onClick={loadTopSongs}>
            更多 →
          </button>
        </div>
        <SongList songs={topSongs.slice(0, 10)} emptyText="加载中…" />
      </section>
    </Page>
  );
}
