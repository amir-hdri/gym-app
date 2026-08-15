"use client";

import { useState } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { getInitials, generateAvatarColor } from "@/lib/utils";
import { toast } from "sonner";
import { Save, Lock } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">پروفایل مدیر</h1>
        <p className="text-muted-foreground">مدیریت حساب کاربری شما</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Avatar className="h-24 w-24 ring-4 ring-white/50">
              <AvatarFallback className={`text-2xl ${generateAvatarColor(fullName)} text-white`}>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{fullName}</h2>
              <p className="text-muted-foreground">مدیر باشگاه</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <Tabs defaultValue="info" dir="rtl">
        <TabsList className="bg-white/40 backdrop-blur-xl border border-white/30">
          <TabsTrigger value="info">اطلاعات شخصی</TabsTrigger>
          <TabsTrigger value="security">امنیت</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <FadeIn>
            <Card glass>
              <CardHeader><CardTitle>اطلاعات شخصی</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="نام" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="bg-white/70 backdrop-blur-sm border-white/30" />
                  <Input label="نام خانوادگی" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="bg-white/70 backdrop-blur-sm border-white/30" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="ایمیل" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="bg-white/70 backdrop-blur-sm border-white/30" />
                  <Input label="تلفن" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="bg-white/70 backdrop-blur-sm border-white/30" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}><Save className="ml-2 h-4 w-4" />ذخیره تغییرات</Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        <TabsContent value="security">
          <FadeIn>
            <Card glass>
              <CardHeader><CardTitle>تغییر رمز عبور</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="رمز عبور فعلی"
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="رمز عبور جدید"
                    type="password"
                    value={password.newPass}
                    onChange={(e) => setPassword({ ...password, newPass: e.target.value })}
                  />
                  <Input
                    label="تکرار رمز عبور جدید"
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword}><Lock className="ml-2 h-4 w-4" />تغییر رمز عبور</Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}
