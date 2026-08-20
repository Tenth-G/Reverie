import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Lyrics3DProps {
  currentLine: string;
  nextLine: string;
  rotation: { x: number; y: number };
}

export default function Lyrics3D({
  currentLine,
  nextLine,
  rotation,
}: Lyrics3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="lyrics-3d">
      <div
        className="lyrics-3d-current"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x * 20}rad) rotateY(${rotation.y * 20}rad)`,
        }}
      >
        {currentLine}
      </div>
      <div
        className="lyrics-3d-next"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x * 20}rad) rotateY(${rotation.y * 20}rad)`,
        }}
      >
        {nextLine}
      </div>
    </div>
  );
}
