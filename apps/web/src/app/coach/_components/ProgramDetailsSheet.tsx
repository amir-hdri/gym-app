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
import type { TrainingProgram } from "@/lib/types";
import { PROGRAM_STATUSES } from "../_meta";
import { SelectField } from "./SelectField";
import { fromDateInputValue, jalaliLong, toDateInputValue } from "../_dates";

const detailsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "عنوان برنامه را وارد کنید")
      .max(80, "عنوان حداکثر ۸۰ کاراکتر است"),
    description: z.string().trim().max(600, "توضیحات حداکثر ۶۰۰ کاراکتر است"),
    startDate: z.string().min(1, "تاریخ شروع را انتخاب کنید"),
    endDate: z.string().min(1, "تاریخ پایان را انتخاب کنید"),
    frequencyPerWeek: z.string().min(1, "روزهای تمرین را انتخاب کنید"),
    status: z.enum(["draft", "active", "completed", "archived"]),
  })
  .refine((values) => values.endDate > values.startDate, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
    path: ["endDate"],
  });

type DetailsFormValues = z.infer<typeof detailsSchema>;

/** The subset of a program a coach edits here, ready for `useUpdateTrainingProgram`. */
export interface ProgramDetailsPatch {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  frequencyPerWeek: number;
  status: TrainingProgram["status"];
}

interface ProgramDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: TrainingProgram;
  pending: boolean;
  onSubmit: (patch: ProgramDetailsPatch) => void | Promise<void>;
}

const frequencyOptions = Array.from({ length: 7 }, (_, index) => ({
  value: String(index + 1),
  label: `${formatPersianNumber(index + 1)} روز در هفته`,
}));

const statusOptions = PROGRAM_STATUSES.map((item) => ({ value: item.value, label: item.label }));

export function ProgramDetailsSheet({
  open,
  onOpenChange,
  program,
  pending,
  onSubmit,
}: ProgramDetailsSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="ویرایش مشخصات برنامه"
      description="حرکت‌های برنامه از این فرم تغییر نمی‌کنند."
    >
      <ProgramDetailsFields
        key={program.updatedAt}
        program={program}
        pending={pending}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}

function ProgramDetailsFields({
  program,
  pending,
  onCancel,
  onSubmit,
}: Omit<ProgramDetailsSheetProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: program.name,
      description: program.description ?? "",
      startDate: toDateInputValue(program.startDate),
      endDate: toDateInputValue(program.endDate),
      frequencyPerWeek: String(program.frequencyPerWeek),
      status: program.status,
    },
  });

  const frequency = watch("frequencyPerWeek");
  const status = watch("status");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const submit = handleSubmit((values) =>
    onSubmit({
      name: values.name.trim(),
      description: values.description.trim() === "" ? undefined : values.description.trim(),
      startDate: fromDateInputValue(values.startDate),
      endDate: fromDateInputValue(values.endDate),
      frequencyPerWeek: Number(values.frequencyPerWeek),
      status: values.status,
    })
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Input
        id="program-details-name"
        label="عنوان برنامه"
        required
        error={errors.name?.message}
        disabled={pending}
        {...register("name")}
      />

      <Textarea
        id="program-details-description"
        label="توضیح برنامه"
        rows={3}
        error={errors.description?.message}
        disabled={pending}
        {...register("description")}
      />

      <div className="grid gap-4 @sm:grid-cols-2">
        <Input
          id="program-details-start"
          label="تاریخ شروع"
          type="date"
          required
          hint={startDate ? jalaliLong(fromDateInputValue(startDate)) : undefined}
          error={errors.startDate?.message}
          disabled={pending}
          {...register("startDate")}
        />
        <Input
          id="program-details-end"
          label="تاریخ پایان"
          type="date"
          required
          hint={endDate ? jalaliLong(fromDateInputValue(endDate)) : undefined}
          error={errors.endDate?.message}
          disabled={pending}
          {...register("endDate")}
        />
      </div>

      <SelectField
        id="program-details-frequency"
        label="روزهای تمرین در هفته"
        required
        value={frequency}
        onValueChange={(value) =>
          setValue("frequencyPerWeek", value, { shouldDirty: true, shouldValidate: true })
        }
        options={frequencyOptions}
        error={errors.frequencyPerWeek?.message}
        disabled={pending}
      />

      <SelectField
        id="program-details-status"
        label="وضعیت"
        required
        value={status}
        onValueChange={(value) =>
          setValue("status", value as TrainingProgram["status"], {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        options={statusOptions}
        hint="تا وقتی پیش‌نویس است، شاگرد برنامه را نمی‌بیند."
        error={errors.status?.message}
        disabled={pending}
      />

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          انصراف
        </Button>
        <Button type="submit" loading={pending}>
          ذخیره مشخصات
        </Button>
      </div>
    </form>
  );
}
