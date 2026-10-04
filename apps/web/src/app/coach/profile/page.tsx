"use client";

import { useState } from "react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { TwilightCard } from "@/components/twilight/controls";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { getInitials, generateAvatarColor } from "@/lib/utils";
import { toast } from "sonner";
import { Save, Lock } from "lucide-react";

export default function CoachProfilePage() {
  const [profile, setProfile] = useState({
    firstName: "دکتر محمد", lastName: "احمدی", email: "m.ahmadi@example.com", phone: "۰۹۱۲۱۱۱۲۲۳۳",
    specialty: "بدنسازی و فیتنس", experience: "۸ سال", bio: "مربی حرفه‌ای بدنسازی با سابقه ۸ سال مربیگری",
  });
  const [password, setPassword] = useState({ current: "", newPass: "", confirm: "" });
  const [selectedSpecialty, setSelectedSpecialty] = useState(profile.specialty);
  const [selectedExperience, setSelectedExperience] = useState(profile.experience);

  const fullName = `${profile.firstName} ${profile.lastName}`;

  const specialties = ["بدنسازی و فیتنس", "قدرتی و حرفه‌ای", "هوازی و استقامتی", "فانکشنال", "کراس‌فیت", "یوگا و پیلاتس"];
  const experienceOptions = ["۱-۳ سال", "۳-۵ سال", "۵-۱۰ سال", "بیش از ۱۰ سال"];

  const handleSaveProfile = () => {
    setProfile({ ...profile, specialty: selectedSpecialty, experience: selectedExperience });
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
      <PageHeader title="پروفایل مربی" subtitle="مدیریت اطلاعات حساب شما" />

      <div className="flex flex-col items-center pt-2">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#d2c0a5] bg-gradient-to-br from-[#2a3444] to-[#141a22] shadow-xl">
          <Avatar className="h-full w-full">
            <AvatarFallback className={`text-3xl ${generateAvatarColor(fullName)}`}>{getInitials(fullName)}</AvatarFallback>
          </Avatar>
        </div>
        <h2 className="mt-3.5 font-serif text-2xl font-normal tracking-tight text-white">{fullName}</h2>
        <div className="mt-2">
          <Badge variant="secondary">مربی</Badge>
        </div>
        <p className="mt-1.5 text-xs text-[#8e98a8]">{profile.specialty}</p>
      </div>

      <Tabs defaultValue="info" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl border border-[#232934] bg-[#161a22] p-1">
          <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417] data-[state=active]:shadow-none">اطلاعات شخصی</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417] data-[state=active]:shadow-none">امنیت</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <TwilightCard className="!p-5">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="نام" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                <Input label="نام خانوادگی" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="ایمیل" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                <Input label="تلفن" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>تخصص</Label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{specialties.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>سابقه</Label>
                  <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{experienceOptions.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile}><Save className="ml-2 h-4 w-4" />ذخیره تغییرات</Button>
              </div>
            </div>
          </TwilightCard>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <TwilightCard className="!p-5">
            <div className="space-y-4">
              {(["current", "newPass", "confirm"] as const).map((field) => (
                <Input
                  key={field}
                  label={field === "current" ? "رمز عبور فعلی" : field === "newPass" ? "رمز عبور جدید" : "تکرار رمز عبور جدید"}
                  type="password"
                  value={password[field]}
                  onChange={(e) => setPassword({ ...password, [field]: e.target.value })}
                />
              ))}
              <div className="flex justify-end pt-2">
                <Button onClick={handleChangePassword}><Lock className="ml-2 h-4 w-4" />تغییر رمز عبور</Button>
              </div>
            </div>
          </TwilightCard>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
