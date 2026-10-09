"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PageHeaderProps {
  /** Short Latin eyebrow above the title. */
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

/**
 * The single `<h1>` of every admin page, plus its primary actions. Centralised
 * so no page can accidentally ship a second heading of rank 1.
 */
export function PageHeader({
  kicker,
  title,
  description,
  actions,
  backHref,
  backLabel = "بازگشت",
}: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {backHref && (
        <Button asChild variant="ghost" size="sm" className="-ms-2 text-muted-foreground">
          <Link href={backHref}>
            <ArrowRight aria-hidden className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {kicker && <p className="latin-kicker mb-1.5">{kicker}</p>}
          <h1 className="text-2xl font-black tracking-tight text-foreground @md:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
