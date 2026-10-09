"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorDisplay } from "@/components/ui/DataState";
import { Skeleton } from "@/components/animations/Skeleton";
import { cn } from "@/lib/utils";

export interface PanelProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/** A titled card. Solid, never glass — glass is chrome only (DESIGN_SYSTEM §3). */
export function Panel({ title, description, action, children, className, contentClassName }: PanelProps) {
  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  /** Renders the empty fallback when the query succeeded with nothing in it. */
  isEmpty?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  loadingFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The loading / error / empty gate every data surface has to pass through
 * (DESIGN_SYSTEM §6). Defaults to a skeleton rather than a spinner so the
 * panel keeps its height and nothing shifts when the data lands.
 */
export function QueryState({
  isLoading,
  isError,
  isEmpty = false,
  onRetry,
  errorMessage,
  loadingFallback,
  emptyFallback,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return <>{loadingFallback ?? <Skeleton className="h-40 w-full rounded-2xl" />}</>;
  }
  if (isError) {
    return <ErrorDisplay message={errorMessage} onRetry={onRetry} />;
  }
  if (isEmpty) {
    return <>{emptyFallback ?? <EmptyState title="موردی برای نمایش نیست" />}</>;
  }
  return <>{children}</>;
}
