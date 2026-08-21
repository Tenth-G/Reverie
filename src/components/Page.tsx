import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePlayerStore } from "../store/playerStore";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-heading">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  const activeView = usePlayerStore((s) => s.activeView);
  const savedTop = usePlayerStore(
    (s) => s.viewScrollPositions[activeView] ?? 0,
  );
  const saveViewScroll = usePlayerStore((s) => s.saveViewScroll);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = savedTop;
    window.dispatchEvent(
      new CustomEvent("reverie:page-scroll", {
        detail: { scrollTop: savedTop },
      }),
    );
    return () => saveViewScroll(activeView, node.scrollTop);
  }, [activeView, savedTop, saveViewScroll]);

  return (
    <div className="page">
      <div
        className="page-scroll"
        ref={scrollRef}
        onScroll={(event) => {
          window.dispatchEvent(
            new CustomEvent("reverie:page-scroll", {
              detail: { scrollTop: event.currentTarget.scrollTop },
            }),
          );
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function LoadingState({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
