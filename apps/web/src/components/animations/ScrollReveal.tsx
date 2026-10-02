"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** seconds */
  delay?: number;
  direction?: RevealDirection;
  /** seconds */
  duration?: number;
  scale?: boolean;
  once?: boolean;
  /** IntersectionObserver threshold */
  amount?: number;
  /** px translate distance for the hidden state */
  offset?: number;
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function hiddenTransform(direction: RevealDirection, offset: number, scale: boolean): string {
  const parts: string[] = [];
  if (direction === "up") parts.push(`translateY(${offset}px)`);
  else if (direction === "down") parts.push(`translateY(-${offset}px)`);
  else if (direction === "left") parts.push(`translateX(${offset}px)`);
  else if (direction === "right") parts.push(`translateX(-${offset}px)`);
  if (scale) parts.push("scale(0.96)");
  return parts.join(" ");
}

/**
 * SSR-safe scroll reveal: IntersectionObserver + CSS opacity/translate.
 * No animation library — the element renders hidden on the server and on the
 * first client render (no hydration mismatch), then an effect observes it
 * and flips it visible. Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.5,
  scale = false,
  once = true,
  amount = 0.15,
  offset = 32,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Defer a frame: keeps content visible without a synchronous
      // setState-in-effect (cascading render).
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: amount }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, amount]);

  const style: CSSProperties = {
    transitionProperty: "opacity, transform",
    transitionDuration: `${duration}s`,
    transitionDelay: `${delay}s`,
    transitionTimingFunction: EASE,
    ...(visible
      ? { opacity: 1 }
      : { opacity: 0, transform: hiddenTransform(direction, offset, scale) }),
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/** Backwards-compatible alias — portal pages import ScrollReveal. */
export const ScrollReveal = Reveal;

interface StaggerScrollProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
  amount?: number;
}

interface StaggerContextValue {
  stagger: number;
  delayChildren: number;
  once: boolean;
  amount: number;
}

const StaggerContext = createContext<StaggerContextValue | null>(null);

interface StaggerScrollItemProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  /** Injected by StaggerScroll for direct children; defaults to 0. */
  index?: number;
}

export function StaggerScroll({
  children,
  className,
  stagger = 0.06,
  delayChildren = 0.05,
  once = true,
  amount = 0.1,
}: StaggerScrollProps) {
  // Inject a stable per-item index into direct StaggerScrollItem children.
  // Render-pure: no ref access during render.
  let index = 0;
  const items = Children.map(children, (child) => {
    if (isValidElement(child) && child.type === StaggerScrollItem) {
      return cloneElement(child as ReactElement<StaggerScrollItemProps>, { index: index++ });
    }
    return child;
  });
  const value = useMemo<StaggerContextValue>(
    () => ({ stagger, delayChildren, once, amount }),
    [stagger, delayChildren, once, amount]
  );

  return (
    <StaggerContext.Provider value={value}>
      <div className={className}>{items}</div>
    </StaggerContext.Provider>
  );
}

export function StaggerScrollItem({ children, className, duration = 0.4, index = 0 }: StaggerScrollItemProps) {
  const ctx = useContext(StaggerContext);
  const delay = ctx ? ctx.delayChildren + index * ctx.stagger : 0;

  return (
    <Reveal
      className={className}
      delay={delay}
      duration={duration}
      once={ctx?.once ?? true}
      amount={ctx?.amount ?? 0.1}
    >
      {children}
    </Reveal>
  );
}
