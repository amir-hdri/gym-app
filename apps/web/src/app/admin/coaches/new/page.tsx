"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { ChevronRight, Save, Loader2 } from "lucide-react";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, CtaButton } from "@/components/twilight/controls";

const coachSchema = z.object({
  firstName: z.string().min(1, "نام را وارد کنید"),
  lastName: z.string().min(1, "نام خانوادگی را وارد کنید"),
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
  phone: z.string().min(1, "شماره موبایل را وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  specialty: z.string().min(1, "تخصص را انتخاب کنید"),
  experience: z.string().min(1, "سابقه را انتخاب کنید"),
});

type CoachFormData = z.infer<typeof coachSchema>;

const specialties = ["بدنسازی و فیتنس", "قدرتی و حرفه‌ای", "هوازی و استقامتی", "فانکشنال", "کراس‌فیت", "یوگا و پیلاتس"];
const experienceOptions = ["۱-۳ سال", "۳-۵ سال", "۵-۱۰ سال", "بیش از ۱۰ سال"];

const inputClass =
  "h-11 w-full rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none";

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
          <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function NewCoachPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CoachFormData>({
    resolver: zodResolver(coachSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", specialty: "", experience: "" },
  });

  const selectedSpecialty = watch("specialty");
  const selectedExperience = watch("experience");

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("مربی جدید با موفقیت ثبت شد");
      router.push("/admin/coaches");
    } catch {
      toast.error("خطا در ثبت مربی");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/coaches"><ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به مربیان</Link>
        </Button>
        <PageHeader title="افزودن مربی جدید" subtitle="ثبت اطلاعات مربی جدید" />
      </div>

      <TwilightCard>
        <SectionTitle className="mb-4">اطلاعات مربی</SectionTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" htmlFor="new-coach-firstName" error={errors.firstName?.message}>
              <input
                id="new-coach-firstName"
                type="text"
                placeholder="احمد"
                aria-invalid={errors.firstName ? "true" : "false"}
                className={inputClass}
                {...register("firstName")}
              />
            </Field>
            <Field label="نام خانوادگی" htmlFor="new-coach-lastName" error={errors.lastName?.message}>
              <input
                id="new-coach-lastName"
                type="text"
                placeholder="احمدی"
                aria-invalid={errors.lastName ? "true" : "false"}
                className={inputClass}
                {...register("lastName")}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ایمیل" htmlFor="new-coach-email" error={errors.email?.message}>
              <input
                id="new-coach-email"
                type="email"
                placeholder="coach@example.com"
                aria-invalid={errors.email ? "true" : "false"}
                className={inputClass}
                {...register("email")}
              />
            </Field>
            <Field label="شماره موبایل" htmlFor="new-coach-phone" error={errors.phone?.message}>
              <input
                id="new-coach-phone"
                type="tel"
                placeholder="۰۹۱۲۱۱۱۲۲۳۳"
                aria-invalid={errors.phone ? "true" : "false"}
                className={inputClass}
                {...register("phone")}
              />
            </Field>
          </div>
          <Field label="رمز عبور" htmlFor="new-coach-password" error={errors.password?.message}>
            <input
              id="new-coach-password"
              type="password"
              placeholder="••••••••"
              aria-invalid={errors.password ? "true" : "false"}
              className={inputClass}
              {...register("password")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>تخصص</Label>
              <Select value={selectedSpecialty} onValueChange={(v) => setValue("specialty", v)}>
                <SelectTrigger className="h-11 rounded-xl border-[#232934] bg-[#161a22] text-sm text-white">
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>{specialties.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
              </Select>
              {errors.specialty && <p className="text-sm text-destructive">{errors.specialty.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>سابقه</Label>
              <Select value={selectedExperience} onValueChange={(v) => setValue("experience", v)}>
                <SelectTrigger className="h-11 rounded-xl border-[#232934] bg-[#161a22] text-sm text-white">
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>{experienceOptions.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
              </Select>
              {errors.experience && <p className="text-sm text-destructive">{errors.experience.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <CtaButton variant="ghost" type="button" onClick={() => router.push("/admin/coaches")} className="w-auto px-6">
              انصراف
            </CtaButton>
            <CtaButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="w-auto px-6">
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                : <Save className="ml-2 h-4 w-4" strokeWidth={1.75} />}
              ثبت مربی
            </CtaButton>
          </div>
        </form>
      </TwilightCard>
    </PageShell>
  );
}
