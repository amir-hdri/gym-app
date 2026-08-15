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
import { useMembershipPlans, useUsers } from "@/hooks/use-api";

const memberSchema = z.object({
  firstName: z.string().min(1, "نام را وارد کنید"),
  lastName: z.string().min(1, "نام خانوادگی را وارد کنید"),
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
  phone: z.string().min(1, "شماره موبایل را وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  plan: z.string().min(1, "طرح اشتراک را انتخاب کنید"),
  coach: z.string().min(1, "مربی را انتخاب کنید"),
});

type MemberFormData = z.infer<typeof memberSchema>;

export default function NewMemberPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: plansRes } = useMembershipPlans();
  const { data: coachesRes } = useUsers("coach");
  const plans = (plansRes?.data || []).map((p) => p.name);
  const coaches = (coachesRes?.data || []).map((c) => `${c.firstName} ${c.lastName}`);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", plan: "", coach: "" },
  });

  const selectedPlan = watch("plan");
  const selectedCoach = watch("coach");

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("عضو جدید با موفقیت ثبت شد");
      router.push("/admin/members");
    } catch {
      toast.error("خطا در ثبت عضو جدید");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/members"><ChevronRight className="h-4 w-4" /> بازگشت به لیست اعضا</Link>
        </Button>
        <h1 className="text-2xl font-bold">افزودن عضو جدید</h1>
        <p className="text-muted-foreground">ثبت اطلاعات ورزشکار جدید</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardHeader><CardTitle>اطلاعات شخصی</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="نام" placeholder="نگار" error={errors.firstName?.message} {...register("firstName")} />
                <Input label="نام خانوادگی" placeholder="محمدی" error={errors.lastName?.message} {...register("lastName")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="ایمیل" type="email" placeholder="ali@example.com" error={errors.email?.message} {...register("email")} />
                <Input label="شماره موبایل" type="tel" placeholder="۰۹۱۲۱۱۱۲۲۳۳" error={errors.phone?.message} {...register("phone")} />
              </div>
              <Input label="رمز عبور" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>طرح اشتراک</Label>
                  <Select value={selectedPlan} onValueChange={(v) => setValue("plan", v)}>
                    <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>{plans.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.plan && <p className="text-sm text-destructive">{errors.plan.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>مربی</Label>
                  <Select value={selectedCoach} onValueChange={(v) => setValue("coach", v)}>
                    <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>{coaches.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.coach && <p className="text-sm text-destructive">{errors.coach.message}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/members")}>انصراف</Button>
                <Button type="submit" loading={isSubmitting}><Save className="ml-2 h-4 w-4" />ثبت عضو</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
