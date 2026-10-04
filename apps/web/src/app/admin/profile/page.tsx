"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { Save, Lock } from "lucide-react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { TwilightCard, CtaButton } from "@/components/twilight/controls";

/** Twilight input override (ui/Input base carries old theme tokens + a dark: variant). */
const inputClassName =
  "h-11 rounded-xl border-[#232934] bg-[#161a22] text-white placeholder:text-[#6b7280] focus-visible:ring-0 focus-visible:border-[#d2c0a5]/50";

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
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#d2c0a5] bg-gradient-to-br from-[#2a3444] to-[#141a22]">
          <span className="font-serif text-2xl text-[#d2c0a5]">{getInitials(fullName)}</span>
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl font-normal text-white">{fullName}</h2>
          <p className="mt-1 text-xs text-[#8e98a8]">مدیر باشگاه</p>
        </div>
      </TwilightCard>

      <Tabs defaultValue="info" dir="rtl">
        <TabsList className="rounded-xl border border-[#232934] bg-[#161a22] p-1">
          <TabsTrigger
            value="info"
            className="rounded-lg text-[#8e98a8] data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417]"
          >
            اطلاعات شخصی
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-lg text-[#8e98a8] data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417]"
          >
            امنیت
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <TwilightCard>
            <h3 className="font-serif text-lg font-normal text-white">اطلاعات شخصی</h3>
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
            <h3 className="font-serif text-lg font-normal text-white">تغییر رمز عبور</h3>
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
