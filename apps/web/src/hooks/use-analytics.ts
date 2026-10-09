/**
 * Analytics hooks (API contract v2 §5) — staff-only series for the dashboard
 * charts. Re-exported from `use-api.ts`, so UI code can import either module.
 *
 * Every series the backend returns is dense and ascending, so a chart can plot
 * the array as-is without filling gaps. The `days` / `months` window is part of
 * the query key: asking for a different window is a different cache entry, not
 * a refetch of the same one.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Q, USE_MOCK, mockService } from "./api-source";

export function useAttendanceTrend(days = 30) {
  return useQuery({
    queryKey: Q.attendanceTrend(days),
    queryFn: () => USE_MOCK ? mockService.getAttendanceTrend(days) : api.getAttendanceTrend(days),
  });
}

export function useRevenueTrend(months = 6) {
  return useQuery({
    queryKey: Q.revenueTrend(months),
    queryFn: () => USE_MOCK ? mockService.getRevenueTrend(months) : api.getRevenueTrend(months),
  });
}

/**
 * Revenue as `{ labels, values }`. Reach for this only when the chart needs the
 * **daily** series — the last 30 days, a window `useRevenueTrend` has no
 * equivalent of. For monthly revenue prefer `useRevenueTrend`: it returns the
 * same totals with the payment count attached and one object per point.
 *
 * `months` is ignored by the server when `period` is `"daily"` (the window is
 * fixed at 30 days), but it stays in the query key so switching period can
 * never read the other period's cached entry.
 */
export function useRevenueSeries(period: "daily" | "monthly" = "monthly", months = 6) {
  return useQuery({
    queryKey: Q.revenueSeries(period, months),
    queryFn: () => USE_MOCK
      ? mockService.getRevenueSeries({ period, months })
      : api.getRevenueSeries({ period, months }),
  });
}

export function useMembershipDistribution() {
  return useQuery({
    queryKey: Q.membershipDistribution,
    queryFn: () => USE_MOCK ? mockService.getMembershipDistribution() : api.getMembershipDistribution(),
  });
}

export function usePeakHours(days = 30) {
  return useQuery({
    queryKey: Q.peakHours(days),
    queryFn: () => USE_MOCK ? mockService.getPeakHours(days) : api.getPeakHours(days),
  });
}

export function useAthleteActivity(athleteId?: string, days = 30) {
  return useQuery({
    queryKey: Q.athleteActivity(athleteId || "", days),
    queryFn: () => USE_MOCK
      ? mockService.getAthleteActivity(athleteId || "", days)
      : api.getAthleteActivity(athleteId || "", days),
    enabled: !!athleteId,
  });
}
