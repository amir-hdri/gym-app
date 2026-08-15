"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    branchName: "باشگاه جیم‌آپ",
    address: "تهران، خیابان ولیعصر، نبش کوچه نور",
    phone: "۰۲۱-۱۲۳۴۵۶۷۸",
    email: "info@gymapp.ir",
    sessionPrice: "۱۵۰,۰۰۰",
    personalSessionPrice: "۳۵۰,۰۰۰",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تنظیمات</h1>
        <p className="text-muted-foreground">مدیریت تنظیمات باشگاه</p>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>بخش باشگاه</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branchName">نام باشگاه</Label>
              <Input
                id="branchName"
                value={form.branchName}
                onChange={(e) => updateField("branchName", e.target.value)}
                className="bg-white/70 backdrop-blur-sm border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">تلفن</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="bg-white/70 backdrop-blur-sm border-white/30"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">آدرس</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="bg-white/70 backdrop-blur-sm border-white/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="bg-white/70 backdrop-blur-sm border-white/30"
            />
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader>
          <CardTitle>بخش قیمت‌گذاری</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionPrice">قیمت هر جلسه عادی (تومان)</Label>
              <Input
                id="sessionPrice"
                value={form.sessionPrice}
                onChange={(e) => updateField("sessionPrice", e.target.value)}
                className="bg-white/70 backdrop-blur-sm border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalSessionPrice">قیمت هر جلسه شخصی (تومان)</Label>
              <Input
                id="personalSessionPrice"
                value={form.personalSessionPrice}
                onChange={(e) => updateField("personalSessionPrice", e.target.value)}
                className="bg-white/70 backdrop-blur-sm border-white/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("تنظیمات با موفقیت ذخیره شد")} className="bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg shadow-green-500/10 hover:bg-white/80">
          <Save className="ml-2 h-4 w-4" />
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}
