"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#232934] bg-[#161a22] space-y-4 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#232934] bg-[#161a22] flex items-center gap-4 rounded-2xl p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton shaped like a portal page: header, stat cards, then content rows. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="در حال بارگذاری صفحه">
      <span className="sr-only">در حال بارگذاری...</span>
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="grid gap-4 min-[380px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-2xl border border-[#232934] bg-[#161a22] space-y-4 rounded-2xl p-5">
        <Skeleton className="h-5 w-36" />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
