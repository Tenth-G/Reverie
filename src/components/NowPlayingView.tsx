import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../store/playerStore";
import ParticleAlbumCover from "./ParticleAlbumCover";
import Lyrics3D from "./Lyrics3D";
import { sizedImage } from "../utils/image";
import { IconChevronDown } from "./icons";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function NowPlayingView() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const lyricLines = usePlayerStore((s) => s.lyricLines);
  const progress = usePlayerStore((s) => s.progress);
  const setPage = usePlayerStore((s) => s.setPage);
  const coverRef = useRef<HTMLDivElement>(null);
  const [fadedIn, setFadedIn] = useState(false);
  const closingRef = useRef(false);
  const [currentLyricLine, setCurrentLyricLine] = useState("");
  const [nextLyricLine, setNextLyricLine] = useState("");
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Parse and update lyrics based on progress
  useEffect(() => {
    if (!lyricLines || !lyricLines.length) {
      setCurrentLyricLine("");
      setNextLyricLine("");
      return;
    }

    let currentIndex = -1;
    for (let i = 0; i < lyricLines.length; i++) {
      if (lyricLines[i].time <= progress) {
        currentIndex = i;
      } else {
        break;
      }
    }

    if (currentIndex >= 0) {
      setCurrentLyricLine(lyricLines[currentIndex].text || "♪");
      if (currentIndex + 1 < lyricLines.length) {
        setNextLyricLine(lyricLines[currentIndex + 1].text || "");
      } else {
        setNextLyricLine("");
      }
    } else {
      setCurrentLyricLine("♪");
      setNextLyricLine(lyricLines[0]?.text || "");
    }
  }, [lyricLines, progress]);

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

  const handleDoubleClick = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div className="now-playing now-playing-3d">
      <button
        className={`np-btn np-back ${fadedIn ? "np-fade-in" : ""}`}
        onClick={handleClose}
        title="返回"
      >
        <IconChevronDown width={20} height={20} />
      </button>

      <div className="np-stage-3d">
        <div className="np-cover-3d" ref={coverRef}>
          {currentSong?.picUrl ? (
            <ParticleAlbumCover
              imageUrl={sizedImage(currentSong.picUrl, 1120)}
              onDoubleClick={handleDoubleClick}
            />
          ) : (
            <div className="np-cover-ph">♪</div>
          )}
        </div>
        {/* 3D lyrics overlay */}
        <div className="np-lyrics-3d">
          <Lyrics3D
            currentLine={currentLyricLine}
            nextLine={nextLyricLine}
            rotation={rotation}
          />
        </div>
      </div>
    </div>
  );
}
