"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { Save, Building2, Phone, MapPin, Mail, Tag, Sparkles } from "lucide-react";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { CtaButton } from "@/components/twilight/controls";

/** Twilight input override (ui/Input base carries old theme tokens + a dark: variant). */
const inputClassName =
  "h-10 rounded-xl border-[#232934] bg-[#12151b] text-sm text-white placeholder:text-[#6b7280] focus-visible:ring-0 focus-visible:border-[#d2c0a5]/50";

function SettingsRow({
  id,
  icon,
  label,
  value,
  onChange,
  type,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[#1a202a]">
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[#8e98a8]">{icon}</span>
        <Label htmlFor={id} className="text-xs font-medium text-white">
          {label}
        </Label>
      </div>
      <div className="w-44 shrink-0 sm:w-60">
        <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputClassName} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState({
    branchName: "باشگاه Lumi Wellness",
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
    <PageShell>
      <PageHeader title="تنظیمات" subtitle="مدیریت تنظیمات باشگاه" />

      <section>
        <SectionTitle>بخش باشگاه</SectionTitle>
        <div className="mt-3 divide-y divide-[#1e2430] overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
          <SettingsRow
            id="branchName"
            icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
            label="نام باشگاه"
            value={form.branchName}
            onChange={(v) => updateField("branchName", v)}
          />
          <SettingsRow
            id="phone"
            icon={<Phone className="h-4 w-4" strokeWidth={1.75} />}
            label="تلفن"
            value={form.phone}
            onChange={(v) => updateField("phone", v)}
          />
          <SettingsRow
            id="address"
            icon={<MapPin className="h-4 w-4" strokeWidth={1.75} />}
            label="آدرس"
            value={form.address}
            onChange={(v) => updateField("address", v)}
          />
          <SettingsRow
            id="email"
            icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
            label="ایمیل"
            type="email"
            value={form.email}
            onChange={(v) => updateField("email", v)}
          />
        </div>
      </section>

      <section>
        <SectionTitle>بخش قیمت‌گذاری</SectionTitle>
        <div className="mt-3 divide-y divide-[#1e2430] overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
          <SettingsRow
            id="sessionPrice"
            icon={<Tag className="h-4 w-4" strokeWidth={1.75} />}
            label="قیمت هر جلسه عادی (تومان)"
            value={form.sessionPrice}
            onChange={(v) => updateField("sessionPrice", v)}
          />
          <SettingsRow
            id="personalSessionPrice"
            icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
            label="قیمت هر جلسه شخصی (تومان)"
            value={form.personalSessionPrice}
            onChange={(v) => updateField("personalSessionPrice", v)}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <CtaButton onClick={() => toast.success("تنظیمات با موفقیت ذخیره شد")} className="w-auto px-6">
          <Save className="h-4 w-4" strokeWidth={1.75} />
          ذخیره تنظیمات
        </CtaButton>
      </div>
    </PageShell>
  );
}
