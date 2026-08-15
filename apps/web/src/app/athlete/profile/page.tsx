"use client";

import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatPersianNumber, formatDate, getInitials, generateAvatarColor } from "@/lib/utils";

const athlete = {
  firstName: "سارا",
  lastName: "حسینی",
  email: "sara.hosseini@email.com",
  phone: "۰۹۱۲۳۴۵۶۷۸۹",
  membership: {
    plan: "اشتراک حرفه‌ای",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    sessionsTotal: 30,
    sessionsUsed: 18,
  },
  stats: {
    totalSessions: 30,
    completedSessions: 18,
    currentStreak: 5,
    longestStreak: 12,
  },
};

export default function ProfilePage() {
  const fullName = `${athlete.firstName} ${athlete.lastName}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight leading-10">پروفایل</h1>
        <p className="mt-1 text-muted-foreground">اطلاعات شخصی شما</p>
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
            <Badge className="mt-1" variant="secondary">ورزشکار</Badge>
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
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">نام</span>
              <span>{athlete.firstName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">نام خانوادگی</span>
              <span>{athlete.lastName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">ایمیل</span>
              <span>{athlete.email}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">تلفن</span>
              <span>{athlete.phone}</span>
            </div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle>اشتراک</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">طرح</span>
              <span className="font-medium">{athlete.membership.plan}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">تاریخ شروع</span>
              <span>{formatDate(athlete.membership.startDate)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">تاریخ پایان</span>
              <span>{formatDate(athlete.membership.endDate)}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">جلسات باقی‌مانده</span>
              <span>{formatPersianNumber(athlete.membership.sessionsTotal - athlete.membership.sessionsUsed)}</span>
            </div>
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
            <div className="text-center">
              <p className="text-3xl font-bold">{formatPersianNumber(athlete.stats.totalSessions)}</p>
              <p className="text-sm text-muted-foreground">کل جلسات</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{formatPersianNumber(athlete.stats.completedSessions)}</p>
              <p className="text-sm text-muted-foreground">جلسات انجام شده</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{formatPersianNumber(athlete.stats.currentStreak)}</p>
              <p className="text-sm text-muted-foreground">روزهای متوالی فعلی</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}
