"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";

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

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-border/60 shadow-lg shadow-black/5 dark:shadow-black/20">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight">تکمیل پروفایل</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                اطلاعات اولیه خود را وارد کنید تا برنامه مناسب تنظیم شود
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Physical Info */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                  <div>
                    <Label htmlFor="height" className="text-sm font-medium text-foreground/80 mb-2 block">قد</Label>
                    <div className="relative"><Input id="height" type="number" inputMode="numeric" placeholder="۱۷۵" className="pl-12" error={errors.height?.message} {...register("height")} /><span dir="ltr" className="pointer-events-none absolute left-4 top-4 text-xs text-muted-foreground">cm</span></div>
                  </div>
                  <div>
                    <Label htmlFor="weight" className="text-sm font-medium text-foreground/80 mb-2 block">وزن</Label>
                    <div className="relative"><Input id="weight" type="number" inputMode="numeric" placeholder="۷۵" className="pl-12" error={errors.weight?.message} {...register("weight")} /><span dir="ltr" className="pointer-events-none absolute left-4 top-4 text-xs text-muted-foreground">kg</span></div>
                  </div>
                  <div>
                    <Label htmlFor="age" className="text-sm font-medium text-foreground/80 mb-2 block">سن</Label>
                    <Input id="age" type="number" inputMode="numeric" placeholder="۲۵" error={errors.age?.message} {...register("age")} />
                  </div>
                </div>
              </motion.div>

              {/* Women-only membership context */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <input type="hidden" value="female" {...register("gender")} />
                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <p className="text-sm font-bold text-primary">فضای اختصاصی بانوان</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">پیشنهادهای تمرینی با تمرکز بر نیازها و اهداف ورزشی بانوان تنظیم می‌شوند.</p>
                </div>
              </motion.div>

              {/* Goal */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Label className="text-sm font-medium text-foreground/80 mb-2 block">هدف تمرینی</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(goalLabels).map(([value, label]) => (
                    <label key={value} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 ${selectedGoal === value ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}>
                      <input type="radio" value={value} className="sr-only" {...register("goal")} />
                      <span className={`text-sm font-medium ${selectedGoal === value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    </label>
                  ))}
                </div>
                {errors.goal && <p className="text-xs text-destructive mt-1">{errors.goal.message}</p>}
              </motion.div>

              {/* Experience */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <Label className="text-sm font-medium text-foreground/80 mb-2 block">سطح تجربه</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(experienceLabels).map(([value, label]) => (
                    <label key={value} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 ${selectedExperience === value ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}>
                      <input type="radio" value={value} className="sr-only" {...register("experience")} />
                      <span className={`text-sm font-medium ${selectedExperience === value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    </label>
                  ))}
                </div>
                {errors.experience && <p className="text-xs text-destructive mt-1">{errors.experience.message}</p>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Button type="submit" loading={isSubmitting} className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20">
                  ذخیره و شروع
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}
