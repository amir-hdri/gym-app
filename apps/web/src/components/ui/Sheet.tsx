"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { installFocusTracker, takeRestoreTarget } from "./focus-restore";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * `bottom` is the mobile default. `start`/`end` are LOGICAL sides — in RTL
   * `start` is the right edge — and resolve in CSS, so there is no
   * direction-sniffing in JS and SSR output is correct.
   */
  side?: "bottom" | "start" | "end";
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Hide the title visually but keep it for assistive tech. */
  hideTitle?: boolean;
  /** Scenic artwork used by the workout player in the reference design. */
  hero?: React.ReactNode;
}

const sideClasses = {
  bottom: [
    "inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-[1.75rem] border-t",
    // Side drawer from `sm` up, as specified: bottom sheet on mobile.
    "sm:inset-y-0 sm:inset-x-auto sm:end-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-md",
    "sm:rounded-t-none sm:rounded-s-[1.75rem] sm:border-t-0 sm:border-s",
  ],
  start: [
    "inset-y-0 start-0 h-full max-h-none w-full max-w-md rounded-e-[1.75rem] border-e",
  ],
  end: ["inset-y-0 end-0 h-full max-h-none w-full max-w-md rounded-s-[1.75rem] border-s"],
} as const;

/**
 * Bottom sheet on mobile, side drawer on desktop.
 *
 * Built on Radix Dialog, so focus trapping, Escape, scroll locking, the
 * `aria-labelledby`/`aria-describedby` wiring and focus restore all come for
 * free (DESIGN_SYSTEM §7). Enter/exit motion is CSS keyed off Radix's
 * `data-state`, which keeps the exit animation working without an
 * `AnimatePresence` wrapper and lets the global `prefers-reduced-motion` rule
 * neutralise it.
 */
export function Sheet({
  open,
  onOpenChange,
  side = "bottom",
  title,
  description,
  children,
  className,
  hideTitle = false,
  hero,
}: SheetProps) {
  // `sm:` responsive classes only make sense for the bottom variant; an
  // explicit start/end stays on that side at every breakpoint.
  const isResponsiveBottom = side === "bottom";
  // WCAG 2.4.3: deterministic focus return to the sheet invoker on close.
  const invokerRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    installFocusTracker();
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-side={isResponsiveBottom ? "bottom" : side}
          onOpenAutoFocus={() => {
            if (document.activeElement instanceof HTMLElement) invokerRef.current = document.activeElement;
          }}
          onCloseAutoFocus={(event) => {
            const target = takeRestoreTarget(invokerRef.current);
            if (target) {
              event.preventDefault();
              target.focus();
            }
          }}
          className={cn(
            "sheet-panel fixed z-50 flex flex-col overflow-hidden border-border bg-card text-card-foreground shadow-[var(--shadow-card-hover)]",
            "outline-none",
            sideClasses[side],
            className
          )}
        >
          {hero && <div className="relative h-56 w-full shrink-0">{hero}</div>}
          <div className={hero ? "absolute inset-x-4 top-4 z-20 flex items-start justify-between" : "relative flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-5"}>
            {/* Grab handle, bottom-sheet only. */}
            {isResponsiveBottom && !hero && (
              <span
                className="absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-full bg-muted-foreground/30 sm:hidden"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title
                className={cn(
                  "truncate text-[17px] font-semibold leading-6 tracking-tight text-foreground",
                  hideTitle && "sr-only"
                )}
              >
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className={cn("mt-1 text-[13px] leading-5 text-muted-foreground", hideTitle && "sr-only")}>
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="-me-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-label="بستن"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", hero ? "relative z-10 -mt-8 px-6 pb-6" : "px-5 py-4")}>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Closes the nearest sheet. Useful for a footer "cancel" button inside `children`. */
export const SheetClose = DialogPrimitive.Close;
