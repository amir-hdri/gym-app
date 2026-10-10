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

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor?: string; children: ReactNode }) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className="w-full space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={errorId} className="flex items-center gap-1 text-xs text-destructive" role="alert">
          <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

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
    <PageShell>
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/members"><ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به لیست اعضا</Link>
        </Button>
        <PageHeader title="افزودن عضو جدید" subtitle="ثبت اطلاعات ورزشکار جدید" />
      </div>

      <TwilightCard>
        <SectionTitle className="mb-4">اطلاعات شخصی</SectionTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" htmlFor="new-member-firstName" error={errors.firstName?.message}>
              <input
                id="new-member-firstName"
                type="text"
                placeholder="نگار"
                aria-invalid={errors.firstName ? "true" : "false"}
                aria-describedby={errors.firstName ? "new-member-firstName-error" : undefined}
                className={inputClass}
                {...register("firstName")}
              />
            </Field>
            <Field label="نام خانوادگی" htmlFor="new-member-lastName" error={errors.lastName?.message}>
              <input
                id="new-member-lastName"
                type="text"
                placeholder="محمدی"
                aria-invalid={errors.lastName ? "true" : "false"}
                aria-describedby={errors.lastName ? "new-member-lastName-error" : undefined}
                className={inputClass}
                {...register("lastName")}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ایمیل" htmlFor="new-member-email" error={errors.email?.message}>
              <input
                id="new-member-email"
                type="email"
                placeholder="ali@example.com"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "new-member-email-error" : undefined}
                className={inputClass}
                {...register("email")}
              />
            </Field>
            <Field label="شماره موبایل" htmlFor="new-member-phone" error={errors.phone?.message}>
              <input
                id="new-member-phone"
                type="tel"
                placeholder="۰۹۱۲۱۱۱۲۲۳۳"
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? "new-member-phone-error" : undefined}
                className={inputClass}
                {...register("phone")}
              />
            </Field>
          </div>
          <Field label="رمز عبور" htmlFor="new-member-password" error={errors.password?.message}>
            <input
                id="new-member-password"
                type="password"
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "new-member-password-error" : undefined}
                className={inputClass}
                {...register("password")}
              />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label id="new-member-plan-label">طرح اشتراک</Label>
              <Select value={selectedPlan} onValueChange={(v) => setValue("plan", v)}>
                <SelectTrigger aria-labelledby="new-member-plan-label" className="h-11 rounded-xl border-border bg-card text-sm text-foreground">
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>{plans.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
              </Select>
              {errors.plan && <p className="text-sm text-destructive" role="alert">{errors.plan.message}</p>}
            </div>
            <div className="space-y-2">
              <Label id="new-member-coach-label">مربی</Label>
              <Select value={selectedCoach} onValueChange={(v) => setValue("coach", v)}>
                <SelectTrigger aria-labelledby="new-member-coach-label" className="h-11 rounded-xl border-border bg-card text-sm text-foreground">
                  <SelectValue placeholder="انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>{coaches.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
              </Select>
              {errors.coach && <p className="text-sm text-destructive" role="alert">{errors.coach.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <CtaButton variant="ghost" type="button" onClick={() => router.push("/admin/members")} className="w-auto px-6">
              انصراف
            </CtaButton>
            <CtaButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="w-auto px-6">
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                : <Save className="ml-2 h-4 w-4" strokeWidth={1.75} />}
              ثبت عضو
            </CtaButton>
          </div>
        </form>
      </TwilightCard>
    </PageShell>
  );
}
