"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// CtaButton lives in its own motion-free module: it is on the landing page's
// critical path and must not pull framer-motion into that bundle.
export { CtaButton, type CtaProps } from "./CtaButton";

/**
 * Twilight Meditation shared controls — literal ports of the reference
 * component patterns (colors, radii, spacing, motion).
 */

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/** Primary surface card: `p-4 rounded-2xl bg-card border border-border` */
export function TwilightCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4",
        hover && "transition-colors hover:border-border",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Row card (list item): `p-3.5 rounded-2xl bg-card border-border
 * hover:border-border`, icon tile `w-10 h-10 rounded-xl bg-secondary
 * border-border text-primary`.
 */
export function RowCard({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  // Keyboard access (WCAG 2.1.1): an actionable card is a real <button>
  // (full-width, start-aligned); otherwise a plain non-focusable region.
  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-3.5 text-start transition-colors hover:border-border",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          {icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary transition-colors group-hover:border-primary/50">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate font-sans text-sm font-medium text-foreground transition-colors group-hover:text-primary">
              {title}
            </h3>
            {subtitle ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </motion.button>
    );
  }
  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-2xl border border-border bg-card p-3.5",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary transition-colors group-hover:border-primary/50">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate font-sans text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          {subtitle ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons (CtaButton: see ./CtaButton — motion-free for the landing path) */
/* ------------------------------------------------------------------ */

/** Circular icon action button (play etc.): `h-11 w-11 rounded-full bg-secondary border-border` (44px target) */
export function CircleIconButton({
  children,
  className,
  label,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Search + filter chips                                               */
/* ------------------------------------------------------------------ */

/** Search field: `h-11 rounded-full bg-card border-border focus:border-primary/50` */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // Placeholder is not a label (WCAG 3.3.2): expose it as the name.
        aria-label={placeholder}
        className="h-11 w-full rounded-full border border-border bg-card py-0 pl-11 pr-11 text-right text-xs text-foreground shadow-xs transition-all placeholder:text-muted-foreground hover:border-input focus:border-primary/50 focus:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="پاک کردن جستجو"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * Filter chips with the reference gliding sand pill (`layoutId`).
 * Active: `bg-primary text-primary-foreground`; inactive: `bg-card
 * border-border text-muted-foreground`.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  labels,
  pillId,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
  pillId: string;
}) {
  return (
    <div className="no-scrollbar relative flex items-center gap-2 overflow-x-auto py-0.5">
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <motion.button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            whileTap={{ scale: 0.94 }}
            aria-pressed={isActive}
            className={cn(
              "relative min-h-11 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 font-sans text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive ? "font-semibold text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <span className="relative z-10">{labels[opt]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card (journey pattern)                                         */
/* ------------------------------------------------------------------ */

/**
 * `p-4 rounded-2xl bg-card border-border` with tracked micro label + tabular value.
 *
 * `tone="blush"` marks a tile showing the MEMBER's own living data
 * (per-athlete stats) with a faint blush wash — theme text stays untouched so
 * contrast holds in both themes. Everything else (business counts, finance,
 * staff aggregates) stays `default`.
 */
export function StatCard({
  label,
  value,
  suffix,
  className,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  className?: string;
  tone?: "default" | "blush";
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs",
        tone === "blush" && "border-blush-solid/30 bg-blush/10",
        className
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-sans text-2xl font-normal tabular-nums tracking-tight text-foreground">{value}</span>
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle (reference profile pattern)                                  */
/* ------------------------------------------------------------------ */

/** `w-11 h-6 rounded-full` (44×24 target), on: `bg-primary`, knob `bg-primary-foreground` */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 cursor-pointer rounded-full p-0.5 transition-colors",
        checked ? "bg-primary" : "bg-border"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn("block h-5 w-5 rounded-full bg-primary-foreground", checked ? "-translate-x-5" : "translate-x-0")}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modal (reference SubscriptionModal pattern)                         */
/* ------------------------------------------------------------------ */

/**
 * Modal shell: backdrop `fixed inset-0 z-50 bg-scrim/85 backdrop-blur-xl`,
 * panel `max-w-sm rounded-[32px] bg-popover border-border p-6`.
 */
export function TwilightModal({
  open,
  onClose,
  children,
  className,
  label = "پنجره گفتگو",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Accessible name for the dialog (WCAG 4.1.2). Defaults to «پنجره گفتگو». */
  label?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);

  // Dialog keyboard contract (WCAG 2.1.1 / 2.4.3): Escape closes, focus moves
  // into the panel on open and returns to the invoker on close.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    const panel = panelRef.current;
    // Wait a frame so the AnimatePresence exit/enter settles before focusing.
    const raf = requestAnimationFrame(() => {
      const target = panel?.querySelector<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
      );
      (target ?? panel)?.focus?.();
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex select-none items-center justify-center bg-scrim/85 p-3 backdrop-blur-xl">
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={cn(
              "relative flex max-h-[92vh] w-full max-w-sm flex-col gap-5 overflow-hidden overflow-y-auto rounded-[32px] border border-border bg-popover p-6 text-foreground shadow-2xl outline-none",
              className
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="absolute left-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "default",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Pastel medallion for member-data empty states. Solid pastel fill with
   * matching foreground ink — contrast-safe in both themes. */
  tone?: "default" | "blush" | "cream";
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center">
      {icon ? (
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border",
            tone === "default" && "border-primary/40 bg-secondary text-primary",
            tone === "blush" && "border-blush-solid/40 bg-blush-solid text-blush-foreground",
            tone === "cream" && "border-cream-foreground/25 bg-cream text-cream-foreground"
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-base font-normal text-foreground">{title}</h3>
      {description ? <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-1 w-full max-w-[240px]">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast (reference App toast pattern)                                 */
/* ------------------------------------------------------------------ */

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          role="status"
          className="fixed top-5 z-50 flex items-center gap-2 rounded-full border border-primary/40 bg-secondary px-4 py-2 text-xs text-foreground shadow-2xl"
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
