"use client";

import { useState } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">پروفایل مربی</h1>
        <p className="text-muted-foreground">مدیریت اطلاعات حساب شما</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Avatar className="h-24 w-24 ring-4 ring-white/50">
              <AvatarFallback className={`text-2xl ${generateAvatarColor(fullName)} text-white`}>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{fullName}</h2>
              <Badge variant="secondary" className="mt-1">مربی</Badge>
              <p className="mt-1 text-sm text-muted-foreground">{profile.specialty}</p>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label>تخصص</Label>
                    <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/30"><SelectValue /></SelectTrigger>
                      <SelectContent>{specialties.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>سابقه</Label>
                    <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/30"><SelectValue /></SelectTrigger>
                      <SelectContent>{experienceOptions.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
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
                {(["current", "newPass", "confirm"] as const).map((field) => (
                  <Input
                    key={field}
                    label={field === "current" ? "رمز عبور فعلی" : field === "newPass" ? "رمز عبور جدید" : "تکرار رمز عبور جدید"}
                    type="password"
                    value={password[field]}
                    onChange={(e) => setPassword({ ...password, [field]: e.target.value })}
                  />
                ))}
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
