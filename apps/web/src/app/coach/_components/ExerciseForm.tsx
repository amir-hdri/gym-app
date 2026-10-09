"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Exercise } from "@/lib/types";
import { DIFFICULTIES } from "../_meta";
import { SelectField } from "./SelectField";

/**
 * Only `difficulty` is a closed enum; `category`, `muscleGroup` and `equipment`
 * are free-text Persian on the server, so they are plain text fields with a
 * `<datalist>` of the values already in the library — a coach can reuse an
 * existing label or coin a new one, and neither is a silent failure.
 *
 * Optional fields stay required-but-empty-allowed strings rather than
 * `.optional()`: that keeps `z.infer` free of `undefined`, which is what
 * react-hook-form's `defaultValues` can actually satisfy. They are dropped from
 * the payload in `toExercisePayload`.
 */
const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} حداکثر ${max} کاراکتر است`);

export const exerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام حرکت را وارد کنید")
    .max(80, "نام حرکت حداکثر ۸۰ کاراکتر است"),
  nameEn: optionalText(80, "نام انگلیسی"),
  category: z
    .string()
    .trim()
    .min(2, "دسته‌بندی را وارد کنید")
    .max(40, "دسته‌بندی حداکثر ۴۰ کاراکتر است"),
  muscleGroup: z
    .string()
    .trim()
    .min(2, "گروه عضلانی را وارد کنید")
    .max(40, "گروه عضلانی حداکثر ۴۰ کاراکتر است"),
  equipment: optionalText(40, "وسیله"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  description: optionalText(600, "توضیحات"),
  instructions: optionalText(1200, "نحوه اجرا"),
  tips: optionalText(600, "نکته‌های مربی"),
  videoUrl: optionalText(300, "نشانی ویدیو").refine(
    (value) => value === "" || /^https?:\/\/\S+$/.test(value),
    "نشانی ویدیو باید با http یا https شروع شود"
  ),
});

export type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export const emptyExerciseValues: ExerciseFormValues = {
  name: "",
  nameEn: "",
  category: "",
  muscleGroup: "",
  equipment: "",
  difficulty: "beginner",
  description: "",
  instructions: "",
  tips: "",
  videoUrl: "",
};

/** The stored row, as form values. */
export function toExerciseFormValues(exercise: Exercise): ExerciseFormValues {
  return {
    name: exercise.name,
    nameEn: exercise.nameEn ?? "",
    category: exercise.category ?? "",
    muscleGroup: exercise.muscleGroup ?? "",
    equipment: exercise.equipment ?? "",
    difficulty: exercise.difficulty,
    description: exercise.description ?? "",
    instructions: exercise.instructions ?? "",
    tips: exercise.tips ?? "",
    videoUrl: exercise.videoUrl ?? "",
  };
}

/** Blank optional fields are omitted, so an empty box never overwrites a value. */
export function toExercisePayload(values: ExerciseFormValues): Partial<Exercise> {
  const trimmed = (value: string) => (value.trim() === "" ? undefined : value.trim());
  return {
    name: values.name.trim(),
    nameEn: trimmed(values.nameEn),
    category: values.category.trim(),
    muscleGroup: values.muscleGroup.trim(),
    equipment: trimmed(values.equipment),
    difficulty: values.difficulty,
    description: trimmed(values.description),
    instructions: trimmed(values.instructions),
    tips: trimmed(values.tips),
    videoUrl: trimmed(values.videoUrl),
  };
}

export interface ExerciseSuggestions {
  categories: string[];
  muscleGroups: string[];
  equipment: string[];
}

interface ExerciseFormProps {
  defaultValues: ExerciseFormValues;
  suggestions: ExerciseSuggestions;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ExerciseFormValues) => void | Promise<void>;
  onCancel: () => void;
  /** Extra controls (e.g. a delete button) rendered beside cancel. */
  footerExtra?: React.ReactNode;
}

const difficultyOptions = DIFFICULTIES.map((item) => ({ value: item.value, label: item.label }));

export function ExerciseForm({
  defaultValues,
  suggestions,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  footerExtra,
}: ExerciseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues,
  });

  const difficulty = watch("difficulty");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>شناسه حرکت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 @sm:grid-cols-2">
            <Input
              id="exercise-name"
              label="نام حرکت"
              placeholder="پرس سینه هالتر"
              required
              error={errors.name?.message}
              disabled={pending}
              {...register("name")}
            />
            <Input
              id="exercise-name-en"
              label="نام انگلیسی"
              dir="ltr"
              placeholder="Barbell Bench Press"
              hint="برای جست‌وجو و منابع آموزشی"
              error={errors.nameEn?.message}
              disabled={pending}
              {...register("nameEn")}
            />
          </div>

          <div className="grid gap-4 @sm:grid-cols-2">
            <div>
              <Input
                id="exercise-category"
                label="دسته‌بندی"
                placeholder="قدرتی"
                required
                list="exercise-category-options"
                error={errors.category?.message}
                disabled={pending}
                {...register("category")}
              />
              <datalist id="exercise-category-options">
                {suggestions.categories.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <div>
              <Input
                id="exercise-muscle"
                label="گروه عضلانی"
                placeholder="سینه"
                required
                list="exercise-muscle-options"
                error={errors.muscleGroup?.message}
                disabled={pending}
                {...register("muscleGroup")}
              />
              <datalist id="exercise-muscle-options">
                {suggestions.muscleGroups.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-4 @sm:grid-cols-2">
            <div>
              <Input
                id="exercise-equipment"
                label="وسیله"
                placeholder="هالتر"
                hint="خالی بگذارید اگر حرکت با وزن بدن انجام می‌شود"
                list="exercise-equipment-options"
                error={errors.equipment?.message}
                disabled={pending}
                {...register("equipment")}
              />
              <datalist id="exercise-equipment-options">
                {suggestions.equipment.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <SelectField
              id="exercise-difficulty"
              label="سطح دشواری"
              required
              value={difficulty}
              onValueChange={(value) =>
                setValue("difficulty", value as ExerciseFormValues["difficulty"], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={difficultyOptions}
              error={errors.difficulty?.message}
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>راهنمای اجرا</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            id="exercise-description"
            label="توضیح کوتاه"
            rows={2}
            placeholder="هدف و ناحیه درگیر در یک جمله"
            error={errors.description?.message}
            disabled={pending}
            {...register("description")}
          />
          <Textarea
            id="exercise-instructions"
            label="نحوه اجرا"
            rows={5}
            placeholder="مرحله‌به‌مرحله بنویسید تا شاگرد بتواند بدون شما هم درست اجرا کند."
            error={errors.instructions?.message}
            disabled={pending}
            {...register("instructions")}
          />
          <Textarea
            id="exercise-tips"
            label="نکته‌های مربی"
            rows={3}
            placeholder="خطاهای رایج، تنفس، محدوده حرکتی"
            error={errors.tips?.message}
            disabled={pending}
            {...register("tips")}
          />
          <Input
            id="exercise-video"
            label="نشانی ویدیو"
            type="url"
            dir="ltr"
            inputMode="url"
            placeholder="https://..."
            hint="اختیاری — در صفحه حرکت به شاگرد نمایش داده می‌شود"
            error={errors.videoUrl?.message}
            disabled={pending}
            {...register("videoUrl")}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>{footerExtra}</div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            انصراف
          </Button>
          <Button type="submit" loading={pending}>
            {!pending && <Save className="h-4 w-4" aria-hidden="true" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
