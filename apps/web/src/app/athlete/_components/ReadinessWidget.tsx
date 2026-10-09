"use client";

import { Activity, Dumbbell, Flame, Moon, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useReadiness, useReadinessHistory } from "@/hooks/use-readiness";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { TwilightCard } from "@/components/twilight/controls";
import { SectionTitle } from "@/components/twilight/Page";

const READINESS_STATES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "energized", label: "پرانرژی", icon: Zap },
  { id: "pumped", label: "پمپ عضلانی", icon: Dumbbell },
  { id: "sore", label: "کوفتگی عضلانی", icon: Flame },
  { id: "recovered", label: "ریکاوری کامل", icon: Activity },
  { id: "fatigued", label: "خسته", icon: Moon },
];

const STATE_DOT: Record<string, string> = {
  energized: "bg-activity-exercise",
  pumped: "bg-activity-move",
  sore: "bg-warning",
  recovered: "bg-activity-stand",
  fatigued: "bg-muted-foreground",
};

function labelFor(state: string): string {
  return READINESS_STATES.find((s) => s.id === state)?.label ?? state;
}

/**
 * Today's readiness chips + the last-7-days energy strip for the athlete
 * dashboard. Today is written through `useReadiness(userId).mutation`;
 * history comes from `useReadinessHistory`.
 */
export function ReadinessWidget() {
  const { user } = useAuth();
  const userId = user?.id;
  const { query, mutation } = useReadiness(userId);
  const historyQuery = useReadinessHistory(userId, 7);

  const todayState = (query.data as { data?: { state?: string | null } } | undefined)?.data?.state ?? null;
  const historyRows = ((historyQuery.data as { data?: { day: string; state: string }[] } | undefined)?.data ?? [])
    .slice(0, 7);

  const handleSelect = (state: string) => {
    if (!userId || mutation.isPending) return;
    mutation.mutate(state, {
      onSuccess: () => toast.success(`وضعیت امروز ثبت شد: ${labelFor(state)}`),
      onError: (e) => toast.error((e as Error)?.message || "ثبت وضعیت ناموفق بود"),
    });
  };

  if (!userId) return null;

  return (
    <TwilightCard className="flex flex-col gap-4">
      <SectionTitle
        action={
          mutation.isPending ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner size="sm" label={null} />
              در حال ثبت…
            </span>
          ) : undefined
        }
      >
        وضعیت آمادگی امروز
      </SectionTitle>

      {query.isLoading ? (
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <Spinner size="sm" label={null} />
          در حال بارگذاری وضعیت امروز…
        </div>
      ) : query.isError ? (
        <p role="alert" className="py-2 text-center text-xs text-destructive">
          {(query.error as Error)?.message || "خطا در بارگذاری وضعیت امروز"}
        </p>
      ) : (
        <div className="no-scrollbar flex items-stretch gap-2 overflow-x-auto py-1" role="group" aria-label="انتخاب وضعیت آمادگی امروز">
          {READINESS_STATES.map((item) => {
            const Icon = item.icon;
            const isSelected = todayState === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelect(item.id)}
                disabled={mutation.isPending}
                className={cn(
                  "flex min-h-11 min-w-[72px] flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-colors disabled:cursor-wait disabled:opacity-60",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold text-muted-foreground">انرژی ۷ روز اخیر</p>
        {historyQuery.isLoading ? (
          <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Spinner size="sm" label={null} />
            در حال بارگذاری سوابق انرژی…
          </div>
        ) : historyQuery.isError ? (
          <p role="alert" className="py-2 text-center text-xs text-destructive">
            {(historyQuery.error as Error)?.message || "خطا در بارگذاری سوابق انرژی"}
          </p>
        ) : historyRows.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
            هنوز وضعیتی ثبت نشده — اولین وضعیت را از بالا انتخاب کنید
          </p>
        ) : (
          <ol aria-live="polite" className="flex items-stretch gap-1.5 overflow-x-auto">
            {historyRows.map((row) => (
              <li
                key={row.day}
                title={`${formatDate(row.day)}: ${labelFor(row.state)}`}
                className="flex min-w-[44px] flex-1 flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-1 py-2"
              >
                <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", STATE_DOT[row.state] ?? "bg-muted-foreground")} />
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(row.day, { weekday: "short" })}
                </span>
                <span className="sr-only">{`${formatDate(row.day)}: ${labelFor(row.state)}`}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </TwilightCard>
  );
}
