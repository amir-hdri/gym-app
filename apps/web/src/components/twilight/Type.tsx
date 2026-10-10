import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Static twilight type primitives (no animation runtime — safe to import from
 * the landing page's critical path).
 *
 * - PageHeader: font-serif text-[24px] title + text-xs muted subtitle
 * - SectionTitle: font-serif text-lg text-foreground font-normal
 * - MicroLabel: Latin-only 10px tracked uppercase cream label
 * - MicroLabelFa: Persian micro label (no letter-spacing — breaks joining)
 */

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 pt-1", className)}>
      <div className="min-w-0">
        <h1 className="font-serif text-[24px] font-normal leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 font-sans text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="font-serif text-lg font-normal text-foreground">{children}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Latin-only micro label: 10px, tracked 0.2em, uppercase, cream. Never apply to Persian text. */
export function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-primary",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Persian micro label: small + semibold + muted, no letter-spacing (breaks joining). */
export function MicroLabelFa({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block text-[11px] font-semibold text-muted-foreground", className)}>
      {children}
    </span>
  );
}
