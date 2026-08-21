export interface CoverOrigin {
  left: number;
  top: number;
  width: number;
  height: number;
}

let origin: CoverOrigin | null = null;

export function captureCoverOrigin(element: Element) {
  const rect = element.getBoundingClientRect();
  origin = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function readCoverOrigin(): CoverOrigin | null {
  return origin;
}
