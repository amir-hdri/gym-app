"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { formatPersianNumber } from "@/lib/utils";
import type { Exercise, ProgramExercise } from "@/lib/types";
import { WEEK_DAYS } from "../_meta";
import { SelectField } from "./SelectField";

/**
 * Numeric inputs are validated as digit strings rather than through
 * `z.coerce.number()`: an `<input type="number">` hands react-hook-form a
 * string, and coercion would make `z.infer` disagree with `defaultValues`.
 * The parent receives real numbers via `ProgramExerciseDraft`.
 */
const digits = (message: string) => z.string().trim().regex(/^\d+$/, message);

const draftSchema = z.object({
  exerciseId: z.string().min(1, "حرکت را انتخاب کنید"),
  dayOfWeek: z.string().min(1, "روز تمرین را انتخاب کنید"),
  position: digits("ترتیب را با رقم وارد کنید").refine(
    (value) => Number(value) >= 1,
    "ترتیب از ۱ شروع می‌شود"
  ),
  sets: digits("تعداد ست را با رقم وارد کنید").refine(
    (value) => Number(value) >= 1 && Number(value) <= 20,
    "تعداد ست بین ۱ تا ۲۰ است"
  ),
  reps: z
    .string()
    .trim()
    .min(1, "تعداد تکرار را وارد کنید")
    .max(20, "تعداد تکرار حداکثر ۲۰ کاراکتر است"),
  weight: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "وزن را با رقم وارد کنید")
    .refine((value) => value === "" || Number(value) <= 500, "وزن حداکثر ۵۰۰ کیلوگرم است"),
  restSeconds: digits("زمان استراحت را با رقم وارد کنید").refine(
    (value) => Number(value) <= 900,
    "زمان استراحت حداکثر ۹۰۰ ثانیه است"
  ),
  notes: z.string().trim().max(300, "یادداشت حداکثر ۳۰۰ کاراکتر است"),
});

type DraftFormValues = z.infer<typeof draftSchema>;

/** What the builder page receives back: parsed, with a 1-based `position`. */
export interface ProgramExerciseDraft {
  exerciseId: string;
  dayOfWeek: number;
  /** 1-based position inside its day, exactly as the coach typed it. */
  position: number;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds: number;
  notes?: string;
}

interface ProgramExerciseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` while adding; the stored row while editing. */
  entry: ProgramExercise | null;
  /** Day the sheet was opened from — the default for a new row. */
  dayOfWeek: number;
  /** 1-based position the row will take if the coach does not change it. */
  position: number;
  /** How many rows each day already holds, for the position hint. */
  countsByDay: number[];
  library: Exercise[];
  pending: boolean;
  onSubmit: (draft: ProgramExerciseDraft) => void | Promise<void>;
}

const dayOptions = WEEK_DAYS.map((day) => ({ value: String(day.value), label: day.label }));

export function ProgramExerciseSheet({
  open,
  onOpenChange,
  entry,
  dayOfWeek,
  position,
  countsByDay,
  library,
  pending,
  onSubmit,
}: ProgramExerciseSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={entry ? "ویرایش حرکت برنامه" : "افزودن حرکت به برنامه"}
      description={
        entry
          ? "می‌توانید روز و ترتیب حرکت را هم تغییر دهید."
          : "حرکت از کتابخانه انتخاب می‌شود؛ ست، تکرار و استراحت مخصوص این برنامه است."
      }
    >
      {/* Remounted per target row, so the fields always start from what the
          coach clicked rather than from the previous open. */}
      <ProgramExerciseFields
        key={`${entry?.id ?? "new"}-${dayOfWeek}-${position}`}
        entry={entry}
        dayOfWeek={dayOfWeek}
        position={position}
        countsByDay={countsByDay}
        library={library}
        pending={pending}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}

interface FieldsProps extends Omit<ProgramExerciseSheetProps, "open" | "onOpenChange"> {
  onCancel: () => void;
}

function ProgramExerciseFields({
  entry,
  dayOfWeek,
  position,
  countsByDay,
  library,
  pending,
  onCancel,
  onSubmit,
}: FieldsProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      exerciseId: entry?.exerciseId ?? "",
      dayOfWeek: String(entry?.dayOfWeek ?? dayOfWeek),
      position: String(position),
      sets: String(entry?.sets ?? 3),
      reps: entry?.reps ?? "10",
      weight: entry?.weight != null ? String(entry.weight) : "",
      restSeconds: String(entry?.restSeconds ?? 60),
      notes: entry?.notes ?? "",
    },
  });

  // Sorted by muscle group then name, and labelled with the group, so a long
  // library stays scannable inside a native-feeling select.
  const exerciseOptions = React.useMemo(
    () =>
      [...library]
        .sort(
          (left, right) =>
            left.muscleGroup.localeCompare(right.muscleGroup, "fa") ||
            left.name.localeCompare(right.name, "fa")
        )
        .map((exercise) => ({
          value: exercise.id,
          label: exercise.muscleGroup ? `${exercise.name} — ${exercise.muscleGroup}` : exercise.name,
        })),
    [library]
  );

  const exerciseId = watch("exerciseId");
  const selectedDay = watch("dayOfWeek");

  const dayIndex = Number(selectedDay);
  const existingInDay = countsByDay[dayIndex] ?? 0;
  const movingWithinDay = entry != null && entry.dayOfWeek === dayIndex;
  const maxPosition = movingWithinDay ? Math.max(1, existingInDay) : existingInDay + 1;

  const submit = handleSubmit((values) =>
    onSubmit({
      exerciseId: values.exerciseId,
      dayOfWeek: Number(values.dayOfWeek),
      position: Number(values.position),
      sets: Number(values.sets),
      reps: values.reps.trim(),
      weight: values.weight.trim() === "" ? undefined : Number(values.weight),
      restSeconds: Number(values.restSeconds),
      notes: values.notes.trim() === "" ? undefined : values.notes.trim(),
    })
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <SelectField
        id="program-entry-exercise"
        label="حرکت"
        required
        value={exerciseId}
        onValueChange={(value) =>
          setValue("exerciseId", value, { shouldDirty: true, shouldValidate: true })
        }
        options={exerciseOptions}
        placeholder="انتخاب از کتابخانه"
        hint={
          exerciseOptions.length === 0
            ? "کتابخانه تمرینات خالی است؛ ابتدا یک حرکت بسازید."
            : undefined
        }
        error={errors.exerciseId?.message}
        disabled={pending || exerciseOptions.length === 0}
      />

      <div className="grid gap-4 @sm:grid-cols-2">
        <SelectField
          id="program-entry-day"
          label="روز تمرین"
          required
          value={selectedDay}
          onValueChange={(value) =>
            setValue("dayOfWeek", value, { shouldDirty: true, shouldValidate: true })
          }
          options={dayOptions}
          error={errors.dayOfWeek?.message}
          disabled={pending}
        />
        <Input
          id="program-entry-position"
          label="ترتیب در روز"
          type="number"
          inputMode="numeric"
          min={1}
          max={maxPosition}
          required
          dir="ltr"
          hint={`۱ تا ${formatPersianNumber(maxPosition)}`}
          error={errors.position?.message}
          disabled={pending}
          {...register("position")}
        />
      </div>

      <div className="grid gap-4 @sm:grid-cols-2">
        <Input
          id="program-entry-sets"
          label="تعداد ست"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          required
          dir="ltr"
          error={errors.sets?.message}
          disabled={pending}
          {...register("sets")}
        />
        <Input
          id="program-entry-reps"
          label="تکرار"
          required
          placeholder="۸-۱۰ یا «تا ناتوانی»"
          hint="متنی است، پس می‌توانید بازه بنویسید"
          error={errors.reps?.message}
          disabled={pending}
          {...register("reps")}
        />
      </div>

      <div className="grid gap-4 @sm:grid-cols-2">
        <Input
          id="program-entry-weight"
          label="وزن (کیلوگرم)"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          dir="ltr"
          hint="برای حرکت‌های با وزن بدن خالی بگذارید"
          error={errors.weight?.message}
          disabled={pending}
          {...register("weight")}
        />
        <Input
          id="program-entry-rest"
          label="استراحت (ثانیه)"
          type="number"
          inputMode="numeric"
          min={0}
          max={900}
          required
          dir="ltr"
          error={errors.restSeconds?.message}
          disabled={pending}
          {...register("restSeconds")}
        />
      </div>

      <Textarea
        id="program-entry-notes"
        label="یادداشت برای شاگرد"
        rows={3}
        placeholder="تمپو، محدوده حرکتی، نکته ایمنی"
        error={errors.notes?.message}
        disabled={pending}
        {...register("notes")}
      />

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          انصراف
        </Button>
        <Button type="submit" loading={pending}>
          {entry ? "ذخیره حرکت" : "افزودن حرکت"}
        </Button>
      </div>
    </form>
  );
}
