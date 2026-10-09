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
        "animate-pulse rounded-xl border border-border bg-card",
        compact ? "h-44" : "h-72"
      )}
    />
  );
}

type RevenueChartProps = { payments: Payment[]; compact?: boolean };
type SessionDurationChartProps = { checkIns: CheckIn[]; compact?: boolean };
type AthleteProgressChartProps = { athletes: CoachDashboardData["athletes"] };

// Analytics series (docs/API_CONTRACT_V2.md §5). Declared structurally so this
// module does not have to import the data layer's types.
type AttendanceTrendChartProps = {
  data: { date: string; checkIns: number; uniqueMembers: number }[];
  compact?: boolean;
};
type RevenueTrendChartProps = {
  data: { month: string; revenue: number; payments: number }[];
  compact?: boolean;
};
/**
 * The `{ labels, values }` shape from `GET /dashboard/revenue`, which is the
 * only source of a *daily* revenue series. Separate from `RevenueTrendChart`
 * because that one parses its labels as months.
 */
type RevenueSeriesChartProps = {
  labels: string[];
  values: number[];
  period?: "daily" | "monthly";
  compact?: boolean;
};
type MembershipDistributionChartProps = {
  data: { planId: string; planName: string; count: number; revenue: number }[];
};
type PeakHoursChartProps = { data: { hour: number; checkIns: number }[]; compact?: boolean };
type AthleteActivityChartProps = {
  data: { date: string; checkedIn: boolean; durationMinutes: number; exercisesCompleted: number }[];
  compact?: boolean;
};

const RevenueChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.RevenueChart }))
);
const SessionDurationChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.SessionDurationChart }))
);
const AthleteProgressChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.AthleteProgressChart }))
);
const AttendanceTrendChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.AttendanceTrendChart }))
);
const RevenueTrendChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.RevenueTrendChart }))
);
const RevenueSeriesChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.RevenueSeriesChart }))
);
const MembershipDistributionChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.MembershipDistributionChart }))
);
const PeakHoursChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.PeakHoursChart }))
);
const AthleteActivityChartLazy = lazy(() =>
  import("./ChartsImpl").then((m) => ({ default: m.AthleteActivityChart }))
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

export function AttendanceTrendChart(props: AttendanceTrendChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton compact={props.compact} />}>
      <AttendanceTrendChartLazy {...props} />
    </Suspense>
  );
}

export function RevenueTrendChart(props: RevenueTrendChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton compact={props.compact} />}>
      <RevenueTrendChartLazy {...props} />
    </Suspense>
  );
}

export function RevenueSeriesChart(props: RevenueSeriesChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton compact={props.compact} />}>
      <RevenueSeriesChartLazy {...props} />
    </Suspense>
  );
}

export function MembershipDistributionChart(props: MembershipDistributionChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <MembershipDistributionChartLazy {...props} />
    </Suspense>
  );
}

export function PeakHoursChart(props: PeakHoursChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton compact={props.compact} />}>
      <PeakHoursChartLazy {...props} />
    </Suspense>
  );
}

export function AthleteActivityChart(props: AthleteActivityChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton compact={props.compact} />}>
      <AthleteActivityChartLazy {...props} />
    </Suspense>
  );
}
