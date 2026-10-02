"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  /** Injected by StaggerContainer for direct children; defaults to 0. */
  index?: number;
}

/**
 * Mount-based stagger (no scroll observation, no animation library):
 * each item fades/slides in once after mount with an incremental delay.
 */
export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  // Inject a stable per-item index into direct StaggerItem children.
  // Render-pure: no ref access during render.
  let index = 0;
  const items = Children.map(children, (child) => {
    if (isValidElement(child) && child.type === StaggerItem) {
      return cloneElement(child as ReactElement<StaggerItemProps>, { index: index++ });
    }
    return child;
  });

  return <div className={className}>{items}</div>;
}

export function StaggerItem({ children, className, index = 0 }: StaggerItemProps) {
  // Start hidden so SSR and the first client render match (no hydration
  // mismatch); reveal on the next frame after mount.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Reveal on the next frame after mount. A synchronous setState here
    // would be a cascading render (react-hooks/set-state-in-effect).
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(12px)",
    transitionProperty: "opacity, transform",
    transitionDuration: "0.3s",
    transitionDelay: `${0.05 + index * 0.05}s`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
