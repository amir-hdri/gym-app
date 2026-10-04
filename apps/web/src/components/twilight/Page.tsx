"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Twilight Meditation page primitives — exact port of the reference screen
 * wrapper patterns (Gym*Screen.tsx):
 * - PageShell: motion.div initial{opacity:0,y:10} → animate{opacity:1,y:0},
 *   0.35s, ease [0.16,1,0.3,1], "flex flex-col gap-6 pb-6 select-none"
 * - PageHeader: font-serif text-[24px] title + text-xs muted subtitle
 * - SectionTitle: font-serif text-lg text-white font-normal
 * - MicroLabel: Latin-only 10px tracked uppercase cream label
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={cn("flex flex-col gap-6 pb-6 text-white select-none", className)}
    >
      {children}
    </motion.div>
  );
}

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
        <h1 className="font-serif text-[24px] font-normal leading-tight tracking-tight text-[#f5f3ef]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 font-sans text-xs text-[#8e98a8]">{subtitle}</p> : null}
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
      <h2 className="font-serif text-lg font-normal text-white">{children}</h2>
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
        "inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d2c0a5]",
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
    <span className={cn("inline-block text-[11px] font-semibold text-[#8e98a8]", className)}>
      {children}
    </span>
  );
}
