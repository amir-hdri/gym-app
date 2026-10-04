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
  "h-11 w-full rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none";

export default function OnboardingPage() {
  const router = useRouter();
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
    `flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#d2c0a5] has-[:focus-visible]:ring-offset-2 ${
      selected ? "border-[#d2c0a5] bg-[#d2c0a5]/5" : "border-[#232934] hover:border-[#333d4e]"
    }`;

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[32px] border border-white/10 bg-[#10141a] p-8 text-white shadow-2xl shadow-black/50"
      >
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-white">تکمیل پروفایل</h1>
          <p className="mt-2 text-sm text-[#8e98a8]">
            اطلاعات اولیه خود را وارد کنید تا برنامه مناسب تنظیم شود
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Physical Info */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
              <div>
                <label htmlFor="height" className="mb-2 block text-xs text-[#8e98a8]">قد</label>
                <div className="relative">
                  <input id="height" type="number" inputMode="numeric" placeholder="175" dir="ltr" className={`${inputClassName} pl-12`} {...register("height")} />
                  <span dir="ltr" className="pointer-events-none absolute left-4 top-4 text-xs text-[#8e98a8]">cm</span>
                </div>
                {errors.height?.message && <p className="mt-1 text-xs text-[#f87171]">{errors.height.message}</p>}
              </div>
              <div>
                <label htmlFor="weight" className="mb-2 block text-xs text-[#8e98a8]">وزن</label>
                <div className="relative">
                  <input id="weight" type="number" inputMode="numeric" placeholder="75" dir="ltr" className={`${inputClassName} pl-12`} {...register("weight")} />
                  <span dir="ltr" className="pointer-events-none absolute left-4 top-4 text-xs text-[#8e98a8]">kg</span>
                </div>
                {errors.weight?.message && <p className="mt-1 text-xs text-[#f87171]">{errors.weight.message}</p>}
              </div>
              <div>
                <label htmlFor="age" className="mb-2 block text-xs text-[#8e98a8]">سن</label>
                <input id="age" type="number" inputMode="numeric" placeholder="25" dir="ltr" className={inputClassName} {...register("age")} />
                {errors.age?.message && <p className="mt-1 text-xs text-[#f87171]">{errors.age.message}</p>}
              </div>
            </div>
          </motion.div>

          {/* Women-only membership context */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <input type="hidden" value="female" {...register("gender")} />
            <div className="rounded-2xl border border-[#d2c0a5]/15 bg-[#d2c0a5]/5 p-4">
              <p className="text-sm font-bold text-[#d2c0a5]">فضای اختصاصی بانوان</p>
              <p className="mt-1 text-xs leading-6 text-[#8e98a8]">پیشنهادهای تمرینی با تمرکز بر نیازها و اهداف ورزشی بانوان تنظیم می‌شوند.</p>
            </div>
          </motion.div>

          {/* Goal */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <span className="mb-2 block text-xs text-[#8e98a8]">هدف تمرینی</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(goalLabels).map(([value, label]) => (
                <label key={value} className={radioClass(selectedGoal === value)}>
                  <input type="radio" value={value} className="sr-only" {...register("goal")} />
                  <span className={`text-sm font-medium ${selectedGoal === value ? "text-[#d2c0a5]" : "text-[#8e98a8]"}`}>{label}</span>
                </label>
              ))}
            </div>
            {errors.goal && <p className="mt-1 text-xs text-[#f87171]">{errors.goal.message}</p>}
          </motion.div>

          {/* Experience */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <span className="mb-2 block text-xs text-[#8e98a8]">سطح تجربه</span>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(experienceLabels).map(([value, label]) => (
                <label key={value} className={radioClass(selectedExperience === value)}>
                  <input type="radio" value={value} className="sr-only" {...register("experience")} />
                  <span className={`text-sm font-medium ${selectedExperience === value ? "text-[#d2c0a5]" : "text-[#8e98a8]"}`}>{label}</span>
                </label>
              ))}
            </div>
            {errors.experience && <p className="mt-1 text-xs text-[#f87171]">{errors.experience.message}</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <CtaButton type="submit" disabled={isSubmitting} className="w-full text-sm">
              {isSubmitting ? "در حال ذخیره…" : "ذخیره و شروع"}
            </CtaButton>
          </motion.div>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
