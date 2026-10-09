"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PageHeaderProps {
  /** The page's single `<h1>`. The `<main id="main">` landmark comes from PortalLayout. */
  title: string;
  description?: string;
  /** Optional "back to list" affordance, rendered above the title. */
  backHref?: string;
  backLabel?: string;
  /** Status chips or badges shown inline after the title. */
  meta?: React.ReactNode;
  /** Primary / secondary actions, right-aligned on wide viewports. */
  actions?: React.ReactNode;
}

/**
 * The one heading surface every coach page uses, so each route renders exactly
 * one `<h1>` (asserted by the shell E2E spec) with consistent type and spacing.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "بازگشت",
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {backHref && (
        <Button variant="ghost" size="sm" asChild className="-ms-2">
          <Link href={backHref}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="flex flex-col items-start gap-3 @sm:flex-row @sm:items-center @sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Size, weight and tracking come from the base layer (§5): h1 is
                display type at 500, and bolding it back up is a regression. */}
            <h1>{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1 leading-7 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap gap-2 @sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}
