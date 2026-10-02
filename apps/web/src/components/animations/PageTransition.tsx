"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Page enter transition without an animation library: the component remounts
 * on every navigation (keyed by pathname in PortalLayout), so the mount
 * animation replays. Exit animations are intentionally dropped — the old
 * `mode="wait"` exit blocked the next page from mounting and taxed INP.
 */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  // Start hidden so SSR and the first client render match (no hydration
  // mismatch); reveal on the next frame after mount.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Reveal on the next frame after mount. A synchronous setState here
    // would be a cascading render (react-hooks/set-state-in-effect).
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const style: CSSProperties = {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(10px)",
    transitionProperty: "opacity, transform",
    transitionDuration: "0.18s",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
