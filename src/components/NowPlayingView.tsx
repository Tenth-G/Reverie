import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import LyricsPanel from "./LyricsPanel";
import { IconChevronDown } from "./icons";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function NowPlayingView() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const setPage = usePlayerStore((s) => s.setPage);
  const coverRef = useRef<HTMLDivElement>(null);
  const [fadedIn, setFadedIn] = useState(false);
  const closingRef = useRef(false);

  // Opening: the cover expands upward from the player bar cover (FLIP).
  useEffect(() => {
    const src = document.querySelector(".pb-cover")?.getBoundingClientRect();
    const dst = coverRef.current?.getBoundingClientRect();
    const cover = coverRef.current;
    if (src && dst && cover) {
      const sx = src.width / dst.width;
      const sy = src.height / dst.height;
      const tx = src.left + src.width / 2 - (dst.left + dst.width / 2);
      const ty = src.top + src.height / 2 - (dst.top + dst.height / 2);
      cover.style.transition = "none";
      cover.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
      cover.style.opacity = "1";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cover.style.transition = `transform 0.5s ${EASE}`;
          cover.style.transform = "translate(0, 0) scale(1)";
          setFadedIn(true);
        });
      });
    } else {
      setFadedIn(true);
    }
    return () => {
      closingRef.current = false;
    };
  }, []);

  // Closing: collapse the cover back to the player bar cover, then navigate.
  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const src = document.querySelector(".pb-cover")?.getBoundingClientRect();
    const dst = coverRef.current?.getBoundingClientRect();
    const cover = coverRef.current;
    if (src && dst && cover) {
      const sx = src.width / dst.width;
      const sy = src.height / dst.height;
      const tx = src.left + src.width / 2 - (dst.left + dst.width / 2);
      const ty = src.top + src.height / 2 - (dst.top + dst.height / 2);
      cover.style.transition = `transform 0.3s ${EASE}, opacity 0.25s ease`;
      cover.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
      cover.style.opacity = "0";
      setFadedIn(false);
      setTimeout(() => setPage("browse"), 280);
    } else {
      setPage("browse");
    }
  };

  return (
    <div className="now-playing">
      <button
        className={`np-btn np-back ${fadedIn ? "np-fade-in" : ""}`}
        onClick={handleClose}
        title="返回"
      >
        <IconChevronDown width={20} height={20} />
      </button>

      <div className="np-stage">
        <div className="np-cover" ref={coverRef}>
          {currentSong?.picUrl ? (
            <img src={currentSong.picUrl} alt="" />
          ) : (
            <div className="np-cover-ph">♪</div>
          )}
        </div>
        {/* lyrics overlay on top of the cover */}
        <div className="np-lyrics">
          <LyricsPanel />
        </div>
      </div>
    </div>
  );
}
