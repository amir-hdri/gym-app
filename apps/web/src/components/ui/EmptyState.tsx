import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * The canonical empty state for every data surface (DESIGN_SYSTEM §6 — a bare
 * spinner is not an acceptable empty state).
 *
 * `components/ui/DataState.tsx` re-exports this so the pages already importing
 * `EmptyState` from there keep working unchanged.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
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
