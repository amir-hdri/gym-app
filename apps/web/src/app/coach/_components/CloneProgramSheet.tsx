"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { formatPersianNumber } from "@/lib/utils";
import type { TrainingProgram, User } from "@/lib/types";
import { SelectField } from "./SelectField";
import { fromDateInputValue, jalaliLong, shiftDateInput, spanInDays, todayDateInput } from "../_dates";

const cloneSchema = z
  .object({
    athleteId: z.string().min(1, "ورزشکار را انتخاب کنید"),
    name: z
      .string()
      .trim()
      .min(3, "عنوان برنامه تازه را وارد کنید")
      .max(80, "عنوان حداکثر ۸۰ کاراکتر است"),
    startDate: z.string().min(1, "تاریخ شروع را انتخاب کنید"),
    endDate: z.string().min(1, "تاریخ پایان را انتخاب کنید"),
  })
  .refine((values) => values.endDate > values.startDate, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
    path: ["endDate"],
  });

type CloneFormValues = z.infer<typeof cloneSchema>;

/** What the templates page sends to `useCreateTrainingProgram`. */
export interface CloneProgramValues {
  athleteId: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface CloneProgramSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The program being used as a blueprint. */
  source: TrainingProgram;
  athletes: User[];
  athletesLoading: boolean;
  pending: boolean;
  /** `null` when idle; otherwise how many exercises have been copied so far. */
  progress: { done: number; total: number } | null;
  onSubmit: (values: CloneProgramValues) => void | Promise<void>;
}

export function CloneProgramSheet({
  open,
  onOpenChange,
  source,
  athletes,
  athletesLoading,
  pending,
  progress,
  onSubmit,
}: CloneProgramSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="استفاده از الگو برای شاگرد"
      description={`حرکت‌های «${source.name}» با همان روز و ترتیب در برنامه تازه کپی می‌شود.`}
    >
      <CloneFields
        key={source.id}
        source={source}
        athletes={athletes}
        athletesLoading={athletesLoading}
        pending={pending}
        progress={progress}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}

function CloneFields({
  source,
  athletes,
  athletesLoading,
  pending,
  progress,
  onCancel,
  onSubmit,
}: Omit<CloneProgramSheetProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  // Seeded once, so the clock is not read again on a later render. The new block
  // keeps the blueprint's length.
  const [seed] = React.useState(() => {
    const start = todayDateInput();
    const length = spanInDays(source.startDate, source.endDate) ?? 28;
    return { start, end: shiftDateInput(start, Math.max(1, length - 1)) };
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CloneFormValues>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      athleteId: "",
      name: source.name,
      startDate: seed.start,
      endDate: seed.end,
    },
  });

  const athleteOptions = React.useMemo(
    () =>
      athletes.map((athlete) => ({
        value: athlete.id,
        label: `${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email,
      })),
    [athletes]
  );

  const athleteId = watch("athleteId");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const submit = handleSubmit((values) =>
    onSubmit({
      athleteId: values.athleteId,
      name: values.name.trim(),
      startDate: fromDateInputValue(values.startDate),
      endDate: fromDateInputValue(values.endDate),
    })
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <SelectField
        id="clone-athlete"
        label="ورزشکار"
        required
        value={athleteId}
        onValueChange={(value) =>
          setValue("athleteId", value, { shouldDirty: true, shouldValidate: true })
        }
        options={athleteOptions}
        placeholder="انتخاب ورزشکار"
        hint={
          athletesLoading
            ? "در حال بارگذاری فهرست ورزشکاران..."
            : athleteOptions.length === 0
              ? "ورزشکاری ثبت نشده است."
              : undefined
        }
        error={errors.athleteId?.message}
        disabled={pending || athleteOptions.length === 0}
      />

      <Input
        id="clone-name"
        label="عنوان برنامه تازه"
        required
        error={errors.name?.message}
        disabled={pending}
        {...register("name")}
      />

      <div className="grid gap-4 @sm:grid-cols-2">
        <Input
          id="clone-start"
          label="تاریخ شروع"
          type="date"
          required
          hint={startDate ? jalaliLong(fromDateInputValue(startDate)) : undefined}
          error={errors.startDate?.message}
          disabled={pending}
          {...register("startDate")}
        />
        <Input
          id="clone-end"
          label="تاریخ پایان"
          type="date"
          required
          hint={endDate ? jalaliLong(fromDateInputValue(endDate)) : undefined}
          error={errors.endDate?.message}
          disabled={pending}
          {...register("endDate")}
        />
      </div>

      <p className="rounded-2xl bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
        {formatPersianNumber(source.exercises.length)} حرکت کپی می‌شود. برنامه تازه به‌عنوان
        پیش‌نویس ساخته می‌شود، پس تا زمانی که آن را فعال نکنید شاگرد چیزی نمی‌بیند.
      </p>

      {/* Copying is one request per exercise, so the count is the honest progress. */}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {progress
          ? `کپی حرکت‌ها: ${formatPersianNumber(progress.done)} از ${formatPersianNumber(progress.total)}`
          : ""}
      </p>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          انصراف
        </Button>
        <Button type="submit" loading={pending}>
          ساخت برنامه از الگو
        </Button>
      </div>
    </form>
  );
}
