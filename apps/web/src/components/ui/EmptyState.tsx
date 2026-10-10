import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /**
   * Pastel medallion for warmth moments (member-data empty states,
   * celebrations). Solid fills with matching foreground ink so contrast
   * holds in both themes. Defaults to the neutral medallion.
   */
  tone?: "default" | "blush" | "cream";
}

/**
 * The canonical empty state for every data surface (DESIGN_SYSTEM §6 — a bare
 * spinner is not an acceptable empty state).
 *
 * `components/ui/DataState.tsx` re-exports this so the pages already importing
 * `EmptyState` from there keep working unchanged.
 */
const medallionTone: Record<NonNullable<EmptyStateProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  blush: "bg-blush-solid text-blush-foreground",
  cream: "bg-cream text-cream-foreground",
};

export function EmptyState({ icon, title, description, action, className, tone = "default" }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      <div
        className={cn("flex h-16 w-16 items-center justify-center rounded-full", medallionTone[tone])}
        aria-hidden="true"
      >
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="mt-4 text-[17px] font-semibold leading-6 text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {action != null && <div className="mt-5">{action}</div>}
    </div>
  );
}
