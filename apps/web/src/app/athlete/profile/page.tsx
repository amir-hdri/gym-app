"use client";

import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatPersianNumber, formatDate, getInitials, generateAvatarColor } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAthleteDashboard, useCheckIns } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { Button } from "@/components/ui/Button";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-10">پروفایل</h1>
          <p className="mt-1 text-muted-foreground">اطلاعات شخصی شما</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link href="/athlete/membership">مشاهده عضویت</Link></Button>
      </div>

      <FadeIn>
        <Card glass>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Avatar className="h-24 w-24 ring-4 ring-white/50">
            <AvatarFallback className={`text-2xl ${generateAvatarColor(fullName)} text-white`}>
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{fullName}</h2>
            <Badge className="mt-1" variant="secondary">{user.role === "athlete" ? "ورزشکار" : user.role}</Badge>
            <p className="mt-2 text-xs text-muted-foreground">{user.email} · {user.phone || "بدون تلفن"}</p>
            {user.branchId && <p className="text-xs text-muted-foreground">شعبه: {user.branchId}</p>}
          </div>
        </CardContent>
      </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-2">
        <Card glass>
          <CardHeader>
            <CardTitle>اطلاعات شخصی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">نام</span><span>{user.firstName}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">نام خانوادگی</span><span>{user.lastName}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">ایمیل</span><span className="break-all text-left" dir="ltr">{user.email}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">تلفن</span><span dir="ltr">{user.phone || "—"}</span></div>
            <div className="flex justify-between pb-2"><span className="text-muted-foreground">وضعیت</span><Badge variant={user.status==="active"?"success":"secondary"}>{user.status}</Badge></div>
          </CardContent>
        </Card>
        <Card glass>
          <CardHeader>
            <CardTitle>اشتراک</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!membership ? <p className="text-sm text-muted-foreground">اشتراک فعالی ثبت نشده است.</p> : <>
            <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">طرح</span><span className="font-medium">{membership.plan?.name || "—"}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">تاریخ شروع</span><span>{membership.startDate ? formatDate(membership.startDate) : "—"}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">تاریخ پایان</span><span>{membership.endDate ? formatDate(membership.endDate) : "—"}</span></div>
            <div className="flex justify-between pb-2"><span className="text-muted-foreground">جلسات باقی‌مانده</span><span>{formatPersianNumber(membership.sessionsRemaining ?? (membership.sessionsTotal - membership.sessionsUsed))}</span></div>
            </>}
          </CardContent>
        </Card>
      </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card glass>
        <CardHeader>
          <CardTitle>آمار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center"><p className="text-3xl font-bold">{formatPersianNumber(totalSessions)}</p><p className="text-sm text-muted-foreground">کل جلسات</p></div>
            <div className="text-center"><p className="text-3xl font-bold">{formatPersianNumber(completedSessions)}</p><p className="text-sm text-muted-foreground">جلسات انجام شده</p></div>
            <div className="text-center"><p className="text-3xl font-bold">{membership ? formatPersianNumber(membership.sessionsRemaining ?? 0) : "—"}</p><p className="text-sm text-muted-foreground">جلسات باقی‌مانده</p></div>
          </div>
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}
