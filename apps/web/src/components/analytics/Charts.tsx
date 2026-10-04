"use client";

import { Suspense, lazy } from "react";
import type { CheckIn, CoachDashboardData, Payment } from "@/lib/types";
import { cn } from "@/lib/utils";

// recharts is ~360KB raw. Load it after hydration so dashboard text/data paint
// first; the skeleton reserves the exact chart height to keep CLS at zero.
type Compact = { compact?: boolean };

function ChartSkeleton({ compact }: Compact) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-xl border border-[#232934] bg-[#161a22]",
        compact ? "h-44" : "h-72"
      )}
    />
  );
}

type RevenueChartProps = { payments: Payment[]; compact?: boolean };
type SessionDurationChartProps = { checkIns: CheckIn[]; compact?: boolean };
type AthleteProgressChartProps = { athletes: CoachDashboardData["athletes"] };

const RevenueChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.RevenueChart }))
);
const SessionDurationChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.SessionDurationChart }))
);
const AthleteProgressChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.AthleteProgressChart }))
);

export function RevenueChart(props: RevenueChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton compact={props.compact} />}>
      <RevenueChartLazy {...props} />
    </Suspense>
  );
}

export function SessionDurationChart(props: SessionDurationChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton compact={props.compact} />}>
      <SessionDurationChartLazy {...props} />
    </Suspense>
  );
}

export function AthleteProgressChart(props: AthleteProgressChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <AthleteProgressChartLazy {...props} />
    </Suspense>
  );
}
