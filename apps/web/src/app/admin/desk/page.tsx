"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck, CreditCard, ListChecks, LogOut, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState, ErrorDisplay, Loading } from "@/components/ui/DataState";
import { FadeIn } from "@/components/animations/FadeIn";
import { QrEntry } from "@/components/checkin/QrEntry";
import {
  useBranches,
  useCheckIns,
  useCheckOut,
  useQrCheckIn,
  useUser,
  useUsers,
} from "@/hooks/use-api";
import { formatDateTime, formatPersianNumber } from "@/lib/utils";
import type { CheckIn, User } from "@/lib/types";
import { fullName } from "../_components/admin-data";
import { PageHeader } from "../_components/PageHeader";
import { Panel } from "../_components/Panel";

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function memberName(checkIn: CheckIn, byId: Map<string, User>): string {
  if (checkIn.user) return fullName(checkIn.user) || checkIn.userId;
  const known = byId.get(checkIn.userId);
  return known ? fullName(known) || checkIn.userId : checkIn.userId;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function DeskPage() {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState("all");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);

  const checkIns = useCheckIns();
  const users = useUsers();
  const branches = useBranches();
  const qrCheckIn = useQrCheckIn();
  const checkOut = useCheckOut();

  const trimmed = code.trim();
  const preview = useUser(trimmed || undefined);
  const lastMember = useUser(lastCode ?? undefined);

  const byId = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of users.data?.data ?? []) map.set(user.id, user);
    return map;
  }, [users.data]);

  const branchList = useMemo(() => branches.data?.data ?? [], [branches.data]);
  const branchName = useMemo(() => {
    const map = new Map(branchList.map((b) => [b.id, b.name] as const));
    return (id: string) => map.get(id) ?? "—";
  }, [branchList]);

  const openSessions = useMemo(() => {
    const rows = (checkIns.data?.data ?? []).filter((c) => !c.checkOutTime);
    const scoped = branchFilter === "all" ? rows : rows.filter((c) => c.branchId === branchFilter);
    return [...scoped].sort((a, b) => +new Date(b.checkInTime) - +new Date(a.checkInTime));
  }, [checkIns.data, branchFilter]);

  const todayCount = useMemo(
    () => (checkIns.data?.data ?? []).filter((c) => isToday(c.checkInTime)).length,
    [checkIns.data]
  );

  function submitCode(value: string) {
    const next = value.trim();
    if (!next) {
      setCodeError("کد عضویت را وارد کنید.");
      return;
    }
    setCodeError(null);
    const known = byId.get(next);
    const previewName = preview.data?.data && next === trimmed ? fullName(preview.data.data) : "";
    const name = (known && fullName(known)) || previewName || undefined;
    qrCheckIn.mutate(next, {
      onSuccess: () => {
        setLastCode(next);
        setLastAt(new Date().toISOString());
        setCode("");
        toast.success(name ? `ورود ${name} ثبت شد` : "ورود عضو ثبت شد");
      },
      onError: (err) => toast.error(errorMessage(err, "ثبت ورود ناموفق بود")),
    });
  }

  function handleCheckout(session: CheckIn) {
    checkOut.mutate(session.id, {
      onSuccess: () => toast.success(`خروج ${memberName(session, byId)} ثبت شد`),
      onError: (err) => toast.error(errorMessage(err, "ثبت خروج ناموفق بود")),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="DESK"
        title="میز پذیرش"
        description="ثبت ورود اعضا و مدیریت جلسات باز امروز"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/checkins">
                <ListChecks aria-hidden className="h-4 w-4" />
                فهرست حضور امروز
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/payments">
                <CreditCard aria-hidden className="h-4 w-4" />
                ثبت پرداخت
              </Link>
            </Button>
          </>
        }
      />

      <FadeIn direction="up">
        <Panel title="ثبت ورود عضو" description="کد عضویت را وارد کنید یا با دوربین اسکن کنید">
          <QrEntry
            code={code}
            onCodeChange={(value) => {
              setCode(value);
              if (codeError) setCodeError(null);
            }}
            onSubmit={() => submitCode(code)}
            onScan={(value) => {
              setCode(value);
              submitCode(value);
            }}
            isPending={qrCheckIn.isPending}
            error={codeError}
          />

          {trimmed.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4" aria-live="polite">
              {preview.isLoading ? (
                <p className="text-sm leading-6 text-muted-foreground">در حال یافتن عضو…</p>
              ) : preview.data?.data ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {fullName(preview.data.data) || preview.data.data.id}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground" dir="ltr">
                      {preview.data.data.id}
                    </p>
                  </div>
                  <Badge variant="success">عضو یافت شد</Badge>
                </div>
              ) : preview.isError ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  عضوی با این کد در فهرست نیست؛ کد را بررسی کنید.
                </p>
              ) : null}
            </div>
          )}

          {lastCode && (
            <div
              className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              aria-live="polite"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush-solid text-blush-foreground"
                aria-hidden="true"
              >
                <CircleCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  ورود {lastMember.data?.data ? fullName(lastMember.data.data) || lastCode : lastCode}{" "}
                  ثبت شد
                </p>
                {lastAt && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {formatDateTime(lastAt)}
                  </p>
                )}
              </div>
            </div>
          )}
        </Panel>
      </FadeIn>

      <FadeIn direction="up" delay={0.05}>
        <Panel
          title="جلسات باز"
          description="اعضایی که هم‌اکنون داخل باشگاه هستند"
          action={
            branchList.length > 0 ? (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                شعبه
                <select
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  aria-label="فیلتر جلسات باز بر اساس شعبه"
                  className="h-11 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">همه شعبه‌ها</option>
                  {branchList.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : undefined
          }
        >
          <p className="sr-only" aria-live="polite">
            {formatPersianNumber(openSessions.length)} جلسه باز
            {checkIns.data ? ` از ${formatPersianNumber(todayCount)} حضور امروز` : ""}
          </p>
          {checkIns.isLoading ? (
            <Loading message="در حال بارگذاری جلسات…" />
          ) : checkIns.isError ? (
            <ErrorDisplay message="جلسات بارگذاری نشد" onRetry={() => void checkIns.refetch()} />
          ) : openSessions.length === 0 ? (
            <EmptyState
              tone="blush"
              icon={<ScanLine aria-hidden className="h-7 w-7" />}
              title="جلسه بازی نیست"
              description="به‌محض ثبت نخستین ورود امروز، جلسه‌ها اینجا نمایش داده می‌شوند."
            />
          ) : (
            <ul className="space-y-3">
              {openSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {memberName(session, byId)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      ورود {formatDateTime(session.checkInTime)} · {branchName(session.branchId)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCheckout(session)}
                    loading={checkOut.isPending}
                    aria-label={`ثبت خروج ${memberName(session, byId)}`}
                  >
                    <LogOut aria-hidden className="h-4 w-4" />
                    ثبت خروج
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </FadeIn>

      <FadeIn direction="up" delay={0.1}>
        <Card className="rounded-2xl">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 @sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">میان‌بر پرداخت</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                تمدید اشتراک یا تسویه بدهی عضو را از بخش پرداخت‌ها انجام دهید.
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/payments">
                <CreditCard aria-hidden className="h-4 w-4" />
                رفتن به پرداخت‌ها
              </Link>
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
