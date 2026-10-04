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
import { Label } from "@/components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard } from "@/components/twilight/controls";
import { ChevronRight, Save } from "lucide-react";
import { useCreateGoal } from "@/hooks/use-api";
import { useAuth } from "@/components/auth/AuthProvider";

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

const inputClassName = "h-11 rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none";

export default function NewGoalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createGoal = useCreateGoal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: "", category: "fitness", current: "0", target: "10", unit: "کیلوگرم", deadline: "", notes: "" },
  });

  const selectedCategory = watch("category");

  const onSubmit = async (formData: { title: string; category: string; current: string; target: string; unit: string; deadline: string; notes?: string }) => {
    setIsSubmitting(true);
    try {
      await createGoal.mutateAsync({
        athleteId: user?.id || "",
        title: formData.title,
        category: formData.category,
        currentValue: Number(formData.current),
        targetValue: Number(formData.target),
        unit: formData.unit,
        targetDate: formData.deadline,
        description: formData.notes || "",
      } as any);
      toast.success("هدف جدید با موفقیت ثبت شد");
      router.push("/athlete/goals");
    } catch {
      toast.error("خطا در ثبت هدف");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/athlete/goals"><ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به اهداف</Link>
        </Button>
        <PageHeader
          title="هدف جدید"
          subtitle="یک هدف تمرینی جدید تعریف کنید"
        />
      </div>

      <TwilightCard className="flex flex-col gap-4">
        <SectionTitle>اطلاعات هدف</SectionTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="عنوان هدف" placeholder="ورزش هوازی روزانه" error={errors.title?.message} {...register("title")} className={inputClassName} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>دسته‌بندی</Label>
              <Select value={selectedCategory} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger className={inputClassName}><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <Input label="مهلت" type="date" error={errors.deadline?.message} {...register("deadline")} className={inputClassName} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="مقدار فعلی" type="number" error={errors.current?.message} {...register("current")} className={inputClassName} />
            <Input label="مقدار هدف" type="number" error={errors.target?.message} {...register("target")} className={inputClassName} />
            <Input label="واحد" placeholder="کیلوگرم" error={errors.unit?.message} {...register("unit")} className={inputClassName} />
          </div>
          <Textarea label="یادداشت" rows={3} placeholder="یادداشت دلخواه..." {...register("notes")} className="rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => router.push("/athlete/goals")}>انصراف</Button>
            <Button type="submit" loading={isSubmitting}><Save className="ml-2 h-4 w-4" strokeWidth={1.75} />ثبت هدف</Button>
          </div>
        </form>
      </TwilightCard>
    </PageShell>
  );
}
