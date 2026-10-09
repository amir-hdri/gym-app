"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatPersianNumber, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { Save, Lock } from "lucide-react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { TwilightCard, CtaButton, StatCard } from "@/components/twilight/controls";
import { Button } from "@/components/ui/Button";
import { useDashboardStats, useUsers } from "@/hooks/use-api";

/** Twilight input override (ui/Input base carries old theme tokens + a dark: variant). */
const inputClassName =
  "h-11 rounded-xl border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary/50";

function StaffStats() {
  const stats = useDashboardStats();
  const athletes = useUsers("athlete");
  const coaches = useUsers("coach");

  const hasData = Boolean(stats.data || athletes.data || coaches.data);
  const isLoading = (stats.isLoading || athletes.isLoading || coaches.isLoading) && !hasData;
  const isError = (stats.isError || athletes.isError || coaches.isError) && !hasData;

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3" role="status" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <StatCard key={i} label="..." value="…" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <TwilightCard className="flex flex-wrap items-center justify-between gap-3">
        <p role="alert" className="text-xs text-muted-foreground">آمار باشگاه بارگذاری نشد</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void stats.refetch();
            void athletes.refetch();
            void coaches.refetch();
          }}
        >
          تلاش دوباره
        </Button>
      </TwilightCard>
    );
  }

  const dashboard = stats.data?.data;
  const memberCount =
    athletes.data?.data?.length ?? dashboard?.activeMembers ?? dashboard?.totalMembers ?? 0;
  const coachCount = coaches.data?.data?.length ?? dashboard?.totalCoaches ?? 0;
  const activeCount = dashboard?.activeMembers ?? memberCount;

  return (
    <div className="grid grid-cols-3 gap-3" aria-live="polite">
      <StatCard label="ورزشکاران" value={formatPersianNumber(memberCount)} suffix="نفر" />
      <StatCard label="مربیان" value={formatPersianNumber(coachCount)} suffix="نفر" />
      <StatCard label="اعضای فعال" value={formatPersianNumber(activeCount)} suffix="نفر" />
    </div>
  );
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({ firstName: "مدیر", lastName: "سیستم", email: "admin@gymapp.ir", phone: "۰۲۱-۱۲۳۴۵۶۷۸" });
  const [password, setPassword] = useState({ current: "", newPass: "", confirm: "" });

  const fullName = `${profile.firstName} ${profile.lastName}`;

  const handleSaveProfile = () => {
    toast.success("پروفایل با موفقیت به‌روزرسانی شد");
  };

  const handleChangePassword = () => {
    if (!password.current || !password.newPass) return;
    if (password.newPass !== password.confirm) { toast.error("رمز عبور و تکرار آن یکسان نیستند"); return; }
    toast.success("رمز عبور با موفقیت تغییر کرد");
    setPassword({ current: "", newPass: "", confirm: "" });
  };

  return (
    <PageShell>
      <PageHeader title="پروفایل مدیر" subtitle="مدیریت حساب کاربری شما" />

      <TwilightCard className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-gradient-to-br from-secondary to-card">
          <span className="font-serif text-2xl text-primary">{getInitials(fullName)}</span>
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl font-normal text-foreground">{fullName}</h2>
          <p className="mt-1 text-xs text-muted-foreground">مدیر باشگاه</p>
        </div>
      </TwilightCard>

      <StaffStats />

      <Tabs defaultValue="info" dir="rtl">
        <TabsList className="rounded-xl border border-border bg-card p-1">
          <TabsTrigger
            value="info"
            className="rounded-lg text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            اطلاعات شخصی
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-lg text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            امنیت
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <TwilightCard>
            <h3 className="font-serif text-lg font-normal text-foreground">اطلاعات شخصی</h3>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="نام" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className={inputClassName} />
                <Input label="نام خانوادگی" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className={inputClassName} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="ایمیل" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputClassName} />
                <Input label="تلفن" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputClassName} />
              </div>
              <div className="flex justify-end">
                <CtaButton onClick={handleSaveProfile} className="w-auto px-6">
                  <Save className="h-4 w-4" strokeWidth={1.75} />
                  ذخیره تغییرات
                </CtaButton>
              </div>
            </div>
          </TwilightCard>
        </TabsContent>

        <TabsContent value="security">
          <TwilightCard>
            <h3 className="font-serif text-lg font-normal text-foreground">تغییر رمز عبور</h3>
            <div className="mt-4 space-y-4">
              <Input
                label="رمز عبور فعلی"
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                className={inputClassName}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="رمز عبور جدید"
                  type="password"
                  value={password.newPass}
                  onChange={(e) => setPassword({ ...password, newPass: e.target.value })}
                  className={inputClassName}
                />
                <Input
                  label="تکرار رمز عبور جدید"
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  className={inputClassName}
                />
              </div>
              <div className="flex justify-end">
                <CtaButton onClick={handleChangePassword} className="w-auto px-6">
                  <Lock className="h-4 w-4" strokeWidth={1.75} />
                  تغییر رمز عبور
                </CtaButton>
              </div>
            </div>
          </TwilightCard>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
