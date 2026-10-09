"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber, formatDate, getInitials } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAthleteDashboard, useCheckIns } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { CtaButton } from "@/components/twilight/controls";
import { User, Mail, Phone, CheckCircle2, Sparkles, CalendarDays, Clock } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data: dashData, isLoading: dashLoading } = useAthleteDashboard(athleteId);
  const { data: checkinsData } = useCheckIns(athleteId);

  if (!user) return <ErrorDisplay message="کاربری یافت نشد — لطفا دوباره وارد شوید." />;
  if (dashLoading) return <Loading />;

  const dashboard = dashData?.data;
  const membership = dashboard?.membership;
  const stats = dashboard?.stats;
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const totalSessions = stats?.totalSessions ?? ((checkinsData as unknown as { data?: unknown[] })?.data?.length ?? 0);
  const completedSessions = stats?.completedSessions ?? (((checkinsData as unknown as { data?: unknown[] })?.data as { checkOutTime?: string | null }[] | undefined)?.filter((c)=>c.checkOutTime)?.length ?? 0);

  const statsRow = [
    { value: formatPersianNumber(totalSessions), label: "کل جلسات" },
    { value: formatPersianNumber(completedSessions), label: "جلسات انجام شده" },
    { value: membership ? formatPersianNumber(membership.sessionsRemaining ?? 0) : "—", label: "جلسات باقی‌مانده" },
  ];

  return (
    <PageShell>
      <PageHeader
        title="پروفایل"
        subtitle="اطلاعات شخصی شما"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/athlete/membership">مشاهده عضویت</Link>
          </Button>
        }
      />

      {/* Profile header — reference avatar pattern */}
      <div className="flex flex-col items-center pt-2">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-gradient-to-br from-secondary to-card shadow-xl">
            <span className="font-serif text-2xl font-bold text-primary">{getInitials(fullName)}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Sparkles className="h-3.5 w-3.5 fill-current" />
          </div>
        </div>
        <h1 className="mt-3.5 font-serif text-2xl font-normal tracking-tight text-foreground">{fullName}</h1>
        <Badge className="mt-2" variant="secondary">{user.role === "athlete" ? "ورزشکار" : user.role}</Badge>
        <p className="mt-2 text-xs text-muted-foreground">
          <span dir="ltr">{user.email}</span> · {user.phone || "بدون تلفن"}
        </p>
        {user.branchId && <p className="mt-1 text-xs text-muted-foreground">شعبه: {user.branchId}</p>}
      </div>

      {/* Stats row with dividers */}
      <div className="flex items-center justify-around border-y border-border px-2 py-3">
        {statsRow.map((s, i) => (
          <div key={s.label} className="flex items-center">
            {i > 0 && <div className="h-7 w-[1px] bg-border mx-4" />}
            <div className="flex flex-col items-center">
              <span className="font-sans text-xl font-medium tabular-nums text-foreground">{s.value}</span>
              <span className="mt-0.5 text-[10px] font-semibold text-muted-foreground">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Membership card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-primary">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{membership?.plan?.name || "بدون اشتراک فعال"}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {membership
                ? `اعتبار تا ${formatDate(membership.endDate)} · ${formatPersianNumber(membership.sessionsRemaining ?? 0)} جلسه باقی‌مانده`
                : "اشتراک فعالی ثبت نشده است."}
            </p>
          </div>
        </div>
        <Link href="/athlete/membership" className="w-full">
          <CtaButton>مدیریت و تمدید اشتراک باشگاه</CtaButton>
        </Link>
      </div>

      {/* Personal info — settings list pattern */}
      <div className="flex flex-col gap-3">
        <SectionTitle>اطلاعات شخصی</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          <ProfileRow icon={<User className="h-4 w-4" strokeWidth={1.75} />} label="نام" value={user.firstName} />
          <ProfileRow icon={<User className="h-4 w-4" strokeWidth={1.75} />} label="نام خانوادگی" value={user.lastName} />
          <ProfileRow icon={<Mail className="h-4 w-4" strokeWidth={1.75} />} label="ایمیل">
            <span className="break-all text-left text-sm text-foreground" dir="ltr">{user.email}</span>
          </ProfileRow>
          <ProfileRow icon={<Phone className="h-4 w-4" strokeWidth={1.75} />} label="تلفن">
            <span className="text-sm text-foreground" dir="ltr">{user.phone || "—"}</span>
          </ProfileRow>
          <ProfileRow icon={<CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />} label="وضعیت">
            <Badge variant={user.status === "active" ? "success" : "secondary"}>{user.status}</Badge>
          </ProfileRow>
        </div>
      </div>

      {/* Membership details — settings list pattern */}
      <div className="flex flex-col gap-3">
        <SectionTitle>اشتراک</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          {!membership ? (
            <p className="px-4 py-3.5 text-sm text-muted-foreground">اشتراک فعالی ثبت نشده است.</p>
          ) : (
            <>
              <ProfileRow icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />} label="طرح" value={membership.plan?.name || "—"} />
              <ProfileRow icon={<CalendarDays className="h-4 w-4" strokeWidth={1.75} />} label="تاریخ شروع" value={membership.startDate ? formatDate(membership.startDate) : "—"} />
              <ProfileRow icon={<CalendarDays className="h-4 w-4" strokeWidth={1.75} />} label="تاریخ پایان" value={membership.endDate ? formatDate(membership.endDate) : "—"} />
              <ProfileRow icon={<Clock className="h-4 w-4" strokeWidth={1.75} />} label="جلسات باقی‌مانده" value={formatPersianNumber(membership.sessionsRemaining ?? (membership.sessionsTotal - membership.sessionsUsed))} />
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="group flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-secondary">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground transition-colors group-hover:text-primary">{icon}</span>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      {children ?? <span className="text-sm text-foreground">{value}</span>}
    </div>
  );
}
