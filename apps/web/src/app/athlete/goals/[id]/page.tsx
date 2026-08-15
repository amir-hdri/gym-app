"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Target, Calendar, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Progress } from "@/components/ui/Progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FadeIn } from "@/components/animations/FadeIn";
import { formatPersianNumber, calculateProgress, calculateDaysRemaining } from "@/lib/utils";
import { useGoal, useUpdateGoalProgress } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import type { Goal } from "@/lib/types";

const goalSchema = z.object({
  title: z.string().min(1, "عنوان هدف را وارد کنید"),
  category: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  current: z.string().min(1, "مقدار فعلی را وارد کنید"),
  target: z.string().min(1, "مقدار هدف را وارد کنید"),
  unit: z.string().min(1, "واحد را وارد کنید"),
  deadline: z.string().min(1, "مهلت را انتخاب کنید"),
  notes: z.string().optional(),
});

const categories = [
  { value: "weight_loss", label: "کاهش وزن" }, { value: "muscle_gain", label: "افزایش عضله" },
  { value: "strength", label: "قدرت" }, { value: "endurance", label: "استقامت" },
];

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGoal(params.id);
  const updateProgress = useUpdateGoalProgress();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const goal = data?.data;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? {
      title: goal.title,
      category: goal.category,
      current: String(goal.currentValue),
      target: String(goal.targetValue),
      unit: goal.unit,
      deadline: goal.targetDate,
      notes: goal.description || "",
    } : undefined,
  });

  const category = watch("category");
  const currentVal = Number(watch("current")) || 0;
  const targetVal = Number(watch("target")) || 1;
  const progress = calculateProgress(currentVal, targetVal);

  const onSubmit = async (formData: { title: string; category: string; current: string; target: string; unit: string; deadline: string; notes?: string }) => {
    setIsSubmitting(true);
    try {
      if (goal) {
        await updateProgress.mutateAsync({ id: goal.id, currentValue: Number(formData.current) });
      }
      toast.success("هدف با موفقیت به‌روزرسانی شد");
      router.push("/athlete/goals");
    } catch {
      toast.error("خطا در به‌روزرسانی هدف");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;
  if (!goal) return <ErrorDisplay message="هدف یافت نشد" />;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/athlete/goals"><ChevronRight className="h-4 w-4" /> بازگشت به اهداف</Link>
        </Button>
      </div>

      <FadeIn>
        <Card glass>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{goal.title}</h1>
                  <Badge variant={goal.status === "achieved" ? "success" : "warning"}>
                    {goal.status === "achieved" ? "تکمیل شده" : "در حال انجام"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />مهلت: {goal.targetDate}</span>
                  <span>{formatPersianNumber(calculateDaysRemaining(goal.targetDate))} روز باقی‌مانده</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card glass>
          <CardHeader><CardTitle>پیشرفت</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">مقدار فعلی</span>
              <span className="text-2xl font-bold">{formatPersianNumber(goal.currentValue)}</span>
            </div>
            <Progress value={progress} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">۰</span>
              <span className="text-sm font-medium">{formatPersianNumber(Math.round(progress))}%</span>
              <span className="text-sm text-muted-foreground">{formatPersianNumber(goal.targetValue)} {goal.unit}</span>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card glass>
          <CardHeader><CardTitle>ویرایش هدف</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="عنوان هدف" error={errors.title?.message} {...register("title")} className="bg-white/70 backdrop-blur-sm border-white/30" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="مقدار فعلی" type="number" error={errors.current?.message} {...register("current")} />
                <Input label="مقدار هدف" type="number" error={errors.target?.message} {...register("target")} />
                <Input label="واحد" placeholder="کیلوگرم" error={errors.unit?.message} {...register("unit")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>دسته‌بندی</Label>
                    <Select value={category} onValueChange={(v) => setValue("category", v as Goal["category"])}>
                    <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/30"><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <Input label="مهلت" type="date" error={errors.deadline?.message} {...register("deadline")} />
              </div>
              <Textarea label="یادداشت" rows={3} className="bg-white/70 backdrop-blur-sm border-white/30" {...register("notes")} />
              <div className="flex justify-between">
                <Button variant="destructive" type="button"><Trash2 className="ml-2 h-4 w-4" />حذف هدف</Button>
                <Button type="submit" loading={isSubmitting}><Save className="ml-2 h-4 w-4" />ذخیره تغییرات</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
