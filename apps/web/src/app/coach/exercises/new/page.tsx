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
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { ChevronRight, Save } from "lucide-react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { TwilightCard } from "@/components/twilight/controls";

const exerciseSchema = z.object({
  name: z.string().min(1, "نام حرکت را وارد کنید"),
  muscle: z.string().min(1, "عضله هدف را انتخاب کنید"),
  equipment: z.string().min(1, "وسیله را انتخاب کنید"),
  difficulty: z.string().min(1, "سطح را انتخاب کنید"),
  description: z.string().min(1, "توضیحات را وارد کنید"),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

const muscleOptions = ["سینه", "پشت", "پاها", "بازو", "شکم", "سرشانه", "جلو بازو", "پشت بازو"];
const equipmentOptions = ["هالتر", "دمبل", "دستگاه", "سیمکش", "بدون وسیله", "کش"];
const difficultyOptions = ["مبتدی", "متوسط", "پیشرفته"];

export default function NewExercisePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { name: "", muscle: "", equipment: "", difficulty: "", description: "" },
  });

  const selectedMuscle = watch("muscle");
  const selectedEquipment = watch("equipment");
  const selectedDifficulty = watch("difficulty");

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("حرکت جدید با موفقیت ثبت شد");
      router.push("/coach/exercises");
    } catch {
      toast.error("خطا در ثبت حرکت");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="افزودن حرکت جدید"
        subtitle="ثبت حرکت ورزشی جدید"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/coach/exercises">
              <ChevronRight className="h-4 w-4" />
              بازگشت
            </Link>
          </Button>
        }
      />

      <TwilightCard className="!p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="نام حرکت" placeholder="پرس سینه هالتر" error={errors.name?.message} {...register("name")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>عضله هدف</Label>
              <Select value={selectedMuscle} onValueChange={(v) => setValue("muscle", v)}>
                <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                <SelectContent>{muscleOptions.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
              </Select>
              {errors.muscle && <p className="text-sm text-destructive">{errors.muscle.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>وسیله</Label>
              <Select value={selectedEquipment} onValueChange={(v) => setValue("equipment", v)}>
                <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                <SelectContent>{equipmentOptions.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
              </Select>
              {errors.equipment && <p className="text-sm text-destructive">{errors.equipment.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>سطح</Label>
              <Select value={selectedDifficulty} onValueChange={(v) => setValue("difficulty", v)}>
                <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                <SelectContent>{difficultyOptions.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
              </Select>
              {errors.difficulty && <p className="text-sm text-destructive">{errors.difficulty.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea id="description" placeholder="توضیحات نحوه اجرای حرکت..." rows={4} error={errors.description?.message} {...register("description")} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => router.push("/coach/exercises")}>انصراف</Button>
            <Button type="submit" loading={isSubmitting}><Save className="ml-2 h-4 w-4" />ذخیره حرکت</Button>
          </div>
        </form>
      </TwilightCard>
    </PageShell>
  );
}
