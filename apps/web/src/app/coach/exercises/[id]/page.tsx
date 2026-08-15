"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { FadeIn } from "@/components/animations/FadeIn";
import { ChevronRight, Save } from "lucide-react";
import { useExercise } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

const editSchema = z.object({
  name: z.string().min(1, "نام حرکت را وارد کنید"),
  muscle: z.string().min(1, "عضله هدف را انتخاب کنید"),
  equipment: z.string().min(1, "وسیله را انتخاب کنید"),
  difficulty: z.string().min(1, "سطح را انتخاب کنید"),
  description: z.string().min(1, "توضیحات را وارد کنید"),
});

const muscleOptions = ["سینه", "پشت", "پاها", "بازو", "شکم", "سرشانه", "جلو بازو", "پشت بازو"];
const equipmentOptions = ["هالتر", "دمبل", "دستگاه", "سیمکش", "بدون وسیله", "کش"];
const difficultyOptions = ["مبتدی", "متوسط", "پیشرفته"];

export default function EditExercisePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, error } = useExercise(params.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", muscle: "", equipment: "", difficulty: "", description: "" },
  });

  const exercise = data?.data;

  useEffect(() => {
    if (exercise) {
      reset({
        name: exercise.name,
        muscle: exercise.muscleGroup,
        equipment: exercise.equipment || "",
        difficulty: exercise.difficulty,
        description: exercise.description || "",
      });
    }
  }, [exercise, reset]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;
  if (!exercise) return null;

  const selectedMuscle = watch("muscle");
  const selectedEquipment = watch("equipment");
  const selectedDifficulty = watch("difficulty");

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("حرکت با موفقیت به‌روزرسانی شد");
      router.push("/coach/exercises");
    } catch {
      toast.error("خطا در به‌روزرسانی");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/coach/exercises"><ChevronRight className="h-4 w-4" /> بازگشت به کتابخانه</Link>
      </Button>

      <FadeIn>
        <Card glass>
          <CardHeader><CardTitle>ویرایش حرکت</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="نام حرکت" error={errors.name?.message} {...register("name")} />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5"><Label>عضله هدف</Label>
                  <Select value={selectedMuscle} onValueChange={(v) => setValue("muscle", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{muscleOptions.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>وسیله</Label>
                  <Select value={selectedEquipment} onValueChange={(v) => setValue("equipment", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{equipmentOptions.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>سطح</Label>
                  <Select value={selectedDifficulty} onValueChange={(v) => setValue("difficulty", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{difficultyOptions.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>توضیحات</Label>
                <Textarea rows={4} className="bg-white/70 backdrop-blur-sm border-white/30" error={errors.description?.message} {...register("description")} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => router.push("/coach/exercises")}>انصراف</Button>
                <Button type="submit" loading={isSubmitting}><Save className="ml-2 h-4 w-4" />ذخیره</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
