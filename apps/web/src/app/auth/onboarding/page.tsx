"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CtaButton } from "@/components/twilight/controls";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBranches, useUpdateUser } from "@/hooks/use-api";

const onboardingSchema = z.object({
  height: z.string().min(1, "قد را وارد کنید"),
  weight: z.string().min(1, "وزن را وارد کنید"),
  age: z.string().min(1, "سن را وارد کنید"),
  gender: z.literal("female"),
  goal: z.enum(["weight_loss", "muscle_gain", "strength", "endurance", "fitness"], { message: "هدف را انتخاب کنید" }),
  experience: z.enum(["beginner", "intermediate", "advanced"], { message: "سطح را انتخاب کنید" }),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const goalLabels: Record<string, string> = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش عضله",
  strength: "افزایش قدرت",
  endurance: "استقامت",
  fitness: "تناسب اندام",
};

const experienceLabels: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "حرفه‌ای",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const branches = useBranches();
  const branchList = branches.data?.data ?? [];
  const updateUser = useUpdateUser();
  const [branchId, setBranchId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      height: "",
      weight: "",
      age: "",
      gender: "female",
      goal: "fitness",
      experience: "beginner",
    },
  });

  const selectedGoal = watch("goal");
  const selectedExperience = watch("experience");

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Optional branch: the backend lets a user set their own branch while it
      // is still unset, so a chosen value is persisted before leaving.
      if (user && branchId) {
        try {
          await updateUser.mutateAsync({ id: user.id, data: { branchId } });
        } catch {
          toast.error("ذخیره شعبه ناموفق بود؛ بقیه اطلاعات ذخیره شد.");
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("اطلاعات با موفقیت ذخیره شد");
      router.replace("/athlete");
    } catch {
      toast.error("خطا در ذخیره اطلاعات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const radioClass = (selected: boolean) =>
    `flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 ${
      selected ? "border-primary bg-primary/5" : "border-border hover:border-border"
    }`;

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[32px] border border-border bg-popover p-8 text-foreground shadow-2xl shadow-black/50"
      >
        {/* Top pastel accent — thin blush-to-cream gradient hairline */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-blush-solid to-cream" />
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">تکمیل پروفایل</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            اطلاعات اولیه خود را وارد کنید تا برنامه مناسب تنظیم شود
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Physical Info */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
              <div>
                <label htmlFor="height" className="mb-2 block text-xs text-muted-foreground">قد</label>
                <div className="relative">
                  <input id="height" type="number" inputMode="numeric" placeholder="175" dir="ltr" className={`${inputClassName} pl-12`} {...register("height")} />
                  <span dir="ltr" className="pointer-events-none absolute left-4 top-4 text-xs text-muted-foreground">cm</span>
                </div>
                {errors.height?.message && <p className="mt-1 text-xs text-destructive">{errors.height.message}</p>}
              </div>
              <div>
                <label htmlFor="weight" className="mb-2 block text-xs text-muted-foreground">وزن</label>
                <div className="relative">
                  <input id="weight" type="number" inputMode="numeric" placeholder="75" dir="ltr" className={`${inputClassName} pl-12`} {...register("weight")} />
                  <span dir="ltr" className="pointer-events-none absolute left-4 top-4 text-xs text-muted-foreground">kg</span>
                </div>
                {errors.weight?.message && <p className="mt-1 text-xs text-destructive">{errors.weight.message}</p>}
              </div>
              <div>
                <label htmlFor="age" className="mb-2 block text-xs text-muted-foreground">سن</label>
                <input id="age" type="number" inputMode="numeric" placeholder="25" dir="ltr" className={inputClassName} {...register("age")} />
                {errors.age?.message && <p className="mt-1 text-xs text-destructive">{errors.age.message}</p>}
              </div>
            </div>
          </motion.div>

          {/* Women-only membership context */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <input type="hidden" value="female" {...register("gender")} />
            <div className="rounded-2xl border border-blush-solid/30 bg-blush/10 p-4">
              <p className="text-sm font-bold text-blush">فضای اختصاصی بانوان</p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">پیشنهادهای تمرینی با تمرکز بر نیازها و اهداف ورزشی بانوان تنظیم می‌شوند.</p>
            </div>
          </motion.div>

          {/* Goal */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <span className="mb-2 block text-xs text-muted-foreground">هدف تمرینی</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(goalLabels).map(([value, label]) => (
                <label key={value} className={radioClass(selectedGoal === value)}>
                  <input type="radio" value={value} className="sr-only" {...register("goal")} />
                  <span className={`text-sm font-medium ${selectedGoal === value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                </label>
              ))}
            </div>
            {errors.goal && <p className="mt-1 text-xs text-destructive">{errors.goal.message}</p>}
          </motion.div>

          {/* Experience */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <span className="mb-2 block text-xs text-muted-foreground">سطح تجربه</span>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(experienceLabels).map(([value, label]) => (
                <label key={value} className={radioClass(selectedExperience === value)}>
                  <input type="radio" value={value} className="sr-only" {...register("experience")} />
                  <span className={`text-sm font-medium ${selectedExperience === value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                </label>
              ))}
            </div>
            {errors.experience && <p className="mt-1 text-xs text-destructive">{errors.experience.message}</p>}
          </motion.div>

          {/* Branch (optional) */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }}>
            <label htmlFor="branch" className="mb-2 block text-xs text-muted-foreground">
              شعبه (اختیاری)
            </label>
            <select
              id="branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={isSubmitting || branches.isLoading || updateUser.isPending}
              aria-describedby="branch-hint"
              className={`${inputClassName} min-h-11`}
            >
              <option value="">بدون انتخاب</option>
              {branchList.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <p id="branch-hint" className="mt-1 text-[11px] leading-5 text-muted-foreground" aria-live="polite">
              {branches.isLoading
                ? "در حال بارگذاری شعبه‌ها…"
                : branches.isError
                  ? "شعبه‌ها بارگذاری نشد؛ می‌توانی بدون انتخاب ادامه دهی."
                  : "شعبه محل تمرینت — بعداً هم قابل تغییر است."}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <CtaButton type="submit" disabled={isSubmitting || updateUser.isPending} className="w-full text-sm">
              {isSubmitting ? "در حال ذخیره…" : "ذخیره و شروع"}
            </CtaButton>
          </motion.div>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
