"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { ChevronRight, Save } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

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
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/coaches"><ChevronRight className="h-4 w-4" /> بازگشت به مربیان</Link>
        </Button>
        <h1 className="text-2xl font-bold">افزودن مربی جدید</h1>
        <p className="text-muted-foreground">ثبت اطلاعات مربی جدید</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardHeader><CardTitle>اطلاعات مربی</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="نام" placeholder="احمد" error={errors.firstName?.message} {...register("firstName")} />
                <Input label="نام خانوادگی" placeholder="احمدی" error={errors.lastName?.message} {...register("lastName")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="ایمیل" type="email" placeholder="coach@example.com" error={errors.email?.message} {...register("email")} />
                <Input label="شماره موبایل" type="tel" placeholder="۰۹۱۲۱۱۱۲۲۳۳" error={errors.phone?.message} {...register("phone")} />
              </div>
              <Input label="رمز عبور" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>تخصص</Label>
                  <Select value={selectedSpecialty} onValueChange={(v) => setValue("specialty", v)}>
                    <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>{specialties.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.specialty && <p className="text-sm text-destructive">{errors.specialty.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>سابقه</Label>
                  <Select value={selectedExperience} onValueChange={(v) => setValue("experience", v)}>
                    <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>{experienceOptions.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.experience && <p className="text-sm text-destructive">{errors.experience.message}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/coaches")}>انصراف</Button>
                <Button type="submit" loading={isSubmitting}><Save className="ml-2 h-4 w-4" />ثبت مربی</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
