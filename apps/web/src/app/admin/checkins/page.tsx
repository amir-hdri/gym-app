"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { EmptyState, ErrorDisplay, Loading } from "@/components/ui/DataState";
import { FadeIn } from "@/components/animations/FadeIn";
import {
  useCheckIns,
  useCheckOutAt,
  useUsers,
  useVoidCheckIn,
} from "@/hooks/use-api";
import { formatDateTime, formatPersianNumber } from "@/lib/utils";
import type { CheckIn, User } from "@/lib/types";
import { fullName } from "../_components/admin-data";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { PageHeader } from "../_components/PageHeader";
import { Panel } from "../_components/Panel";
import { SearchField } from "../_components/TableControls";

type StatusFilter = "all" | "open" | "closed";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "open", label: "باز" },
  { value: "closed", label: "بسته‌شده" },
];

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function currentTimeInput(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function toTodayISO(time: string): string | null {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function resolveName(checkIn: CheckIn, byId: Map<string, User>): string {
  if (checkIn.user) return fullName(checkIn.user) || checkIn.userId;
  const known = byId.get(checkIn.userId);
  return known ? fullName(known) || checkIn.userId : checkIn.userId;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function CheckInsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [times, setTimes] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<CheckIn | null>(null);

  const checkIns = useCheckIns();
  const users = useUsers();
  const checkOutAt = useCheckOutAt();
  const voidCheckIn = useVoidCheckIn();

  const byId = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of users.data?.data ?? []) map.set(user.id, user);
    return map;
  }, [users.data]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (checkIns.data?.data ?? [])
      .filter((c) => isToday(c.checkInTime))
      .filter((c) => {
        if (status === "open") return !c.checkOutTime;
        if (status === "closed") return !!c.checkOutTime;
        return true;
      })
      .filter((c) => {
        if (!needle) return true;
        return (
          resolveName(c, byId).toLowerCase().includes(needle) ||
          c.userId.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => +new Date(b.checkInTime) - +new Date(a.checkInTime));
  }, [checkIns.data, search, status, byId]);

  const openCount = useMemo(() => rows.filter((c) => !c.checkOutTime).length, [rows]);
  const isFiltered = search.trim().length > 0 || status !== "all";

  function handleCheckout(session: CheckIn) {
    const time = (times[session.id] ?? currentTimeInput()).trim();
    const iso = toTodayISO(time);
    if (!iso) {
      toast.error("ساعت خروج معتبر نیست؛ قالب درست ۱۴:۳۰ است.");
      return;
    }
    setActingId(session.id);
    checkOutAt.mutate(
      { id: session.id, checkOutTime: iso },
      {
        onSuccess: () => toast.success(`خروج ${resolveName(session, byId)} ثبت شد`),
        onError: (err) => toast.error(errorMessage(err, "ثبت خروج ناموفق بود")),
        onSettled: () => setActingId(null),
      }
    );
  }

  function handleVoid() {
    if (!voidTarget) return;
    const name = resolveName(voidTarget, byId);
    voidCheckIn.mutate(voidTarget.id, {
      onSuccess: () => {
        toast.success(`حضور ${name} باطل شد`);
        setVoidTarget(null);
      },
      onError: (err) => toast.error(errorMessage(err, "ابطال حضور ناموفق بود")),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="CHECK-INS"
        title="حضور امروز"
        description="جلسات ثبت‌شده امروز، ثبت خروج‌های جامانده و ابطال رکوردهای اشتباه"
      />

      <FadeIn direction="up">
        <Panel title="جلسات امروز" description="فقط رکوردهایی که ورودشان امروز ثبت شده">
          <div className="space-y-4">
            <SearchField
              value={search}
              onValueChange={setSearch}
              label="جستجوی حضور"
              placeholder="نام عضو یا کد عضویت…"
            />

            <div className="flex flex-wrap gap-2" role="group" aria-label="فیلتر وضعیت جلسه">
              {STATUS_FILTERS.map((option) => (
                <Chip
                  key={option.value}
                  selected={status === option.value}
                  onSelect={() => setStatus(option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>

            <p className="text-xs leading-5 text-muted-foreground" aria-live="polite">
              {checkIns.data
                ? `${formatPersianNumber(rows.length)} جلسه امروز · ${formatPersianNumber(openCount)} جلسه باز`
                : "در حال بارگذاری آمار جلسات…"}
            </p>

            {checkIns.isLoading ? (
              <Loading message="در حال بارگذاری حضورها…" />
            ) : checkIns.isError ? (
              <ErrorDisplay message="حضورها بارگذاری نشد" onRetry={() => void checkIns.refetch()} />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck aria-hidden className="h-7 w-7" />}
                title="حضوری برای امروز نیست"
                description={
                  isFiltered
                    ? "هیچ جلسه‌ای با فیلترهای فعلی مطابقت ندارد."
                    : "به‌محض ثبت نخستین ورود از میز پذیرش، این فهرست پر می‌شود."
                }
                action={
                  isFiltered ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setStatus("all");
                      }}
                    >
                      پاک کردن فیلترها
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="space-y-3">
                {rows.map((session) => {
                  const open = !session.checkOutTime;
                  const name = resolveName(session, byId);
                  const timeValue = times[session.id] ?? currentTimeInput();
                  return (
                    <li
                      key={session.id}
                      className="space-y-3 rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{name}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            ورود {formatDateTime(session.checkInTime)}
                          </p>
                        </div>
                        <Badge variant={open ? "warning" : "success"}>
                          {open ? "باز" : "بسته‌شده"}
                        </Badge>
                      </div>

                      {open ? (
                        <div className="flex flex-wrap items-end gap-2">
                          <label className="min-w-36 flex-1 space-y-1.5">
                            <span className="block text-xs font-medium text-muted-foreground">
                              ساعت خروج
                            </span>
                            <input
                              type="time"
                              value={timeValue}
                              onChange={(event) =>
                                setTimes((current) => ({
                                  ...current,
                                  [session.id]: event.target.value,
                                }))
                              }
                              aria-label={`ساعت خروج ${name}`}
                              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCheckout(session)}
                            loading={actingId === session.id && checkOutAt.isPending}
                            disabled={checkOutAt.isPending || voidCheckIn.isPending}
                            aria-label={`ثبت خروج ${name}`}
                          >
                            <LogOut aria-hidden className="h-4 w-4" />
                            ثبت خروج
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setVoidTarget(session)}
                            disabled={checkOutAt.isPending || voidCheckIn.isPending}
                            aria-label={`ابطال حضور ${name}`}
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs leading-5 text-muted-foreground">
                            خروج {session.checkOutTime ? formatDateTime(session.checkOutTime) : "—"}
                            {session.durationMinutes != null &&
                              ` · ${formatPersianNumber(session.durationMinutes)} دقیقه`}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setVoidTarget(session)}
                            disabled={voidCheckIn.isPending}
                            aria-label={`ابطال حضور ${name}`}
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>
      </FadeIn>

      <ConfirmDialog
        open={voidTarget !== null}
        onOpenChange={(open) => {
          if (!open) setVoidTarget(null);
        }}
        title="ابطال حضور"
        description={
          voidTarget
            ? `حضور ${resolveName(voidTarget, byId)} برای همیشه حذف می‌شود. این کار قابل بازگشت نیست.`
            : "این حضور برای همیشه حذف می‌شود."
        }
        confirmLabel="باطل کردن حضور"
        onConfirm={handleVoid}
        loading={voidCheckIn.isPending}
      />
    </div>
  );
}
