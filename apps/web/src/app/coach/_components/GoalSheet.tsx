"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import type { Goal } from "@/lib/types";
import { GOAL_STATUSES } from "../_goals";
import { SelectField } from "./SelectField";
import { fromDateInputValue, jalaliLong, toDateInputValue } from "../_dates";

const decimal = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => /^\d+(\.\d+)?$/.test(value), message);

const goalSchema = z
  .object({
    title: z.string().trim().min(3, "عنوان هدف را وارد کنید").max(80, "عنوان حداکثر ۸۰ کاراکتر است"),
    description: z.string().trim().max(400, "توضیحات حداکثر ۴۰۰ کاراکتر است"),
    targetValue: decimal("مقدار هدف را با رقم وارد کنید"),
    currentValue: decimal("مقدار فعلی را با رقم وارد کنید"),
    unit: z.string().trim().min(1, "واحد را وارد کنید").max(16, "واحد حداکثر ۱۶ کاراکتر است"),
    targetDate: z.string().min(1, "تاریخ هدف را انتخاب کنید"),
    status: z.enum(["not_started", "in_progress", "achieved", "missed", "paused"]),
  })
  .refine((values) => Number(values.targetValue) > 0, {
    message: "مقدار هدف باید بزرگ‌تر از صفر باشد",
    path: ["targetValue"],
  });

type GoalFormValues = z.infer<typeof goalSchema>;

/** What the page sends to `useUpdateGoal`. */
export type GoalPatch = Pick<
  Goal,
  "title" | "targetValue" | "currentValue" | "unit" | "targetDate" | "status"
> & { description?: string };

interface GoalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  pending: boolean;
  onSubmit: (patch: GoalPatch) => void | Promise<void>;
}

const statusOptions = GOAL_STATUSES.map((item) => ({ value: item.value, label: item.label }));

/**
 * Coach-side goal editor. A coach may revise an athlete's goal (§ `useUpdateGoal`),
 * which is a different write from the athlete's own progress slider — so both the
 * target and the recorded value are editable here.
 */
export function GoalSheet({ open, onOpenChange, goal, pending, onSubmit }: GoalSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="ویرایش هدف شاگرد"
      description="تغییر مقدار هدف، مقدار ثبت‌شده یا وضعیت پیگیری."
    >
      <GoalFields
        key={`${goal.id}-${goal.updatedAt}`}
        goal={goal}
        pending={pending}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}

function GoalFields({
  goal,
  pending,
  onCancel,
  onSubmit,
}: Omit<GoalSheetProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description ?? "",
      targetValue: String(goal.targetValue),
      currentValue: String(goal.currentValue),
      unit: goal.unit,
      targetDate: toDateInputValue(goal.targetDate),
      status: goal.status,
    },
  });

  const status = watch("status");
  const targetDate = watch("targetDate");

  const submit = handleSubmit((values) =>
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim() === "" ? undefined : values.description.trim(),
      targetValue: Number(values.targetValue),
      currentValue: Number(values.currentValue),
      unit: values.unit.trim(),
      targetDate: fromDateInputValue(values.targetDate),
      status: values.status,
    })
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Input
        id="goal-title"
        label="عنوان هدف"
        required
        error={errors.title?.message}
        disabled={pending}
        {...register("title")}
      />

      <Textarea
        id="goal-description"
        label="توضیح"
        rows={3}
        error={errors.description?.message}
        disabled={pending}
        {...register("description")}
      />

      <div className="grid gap-4 @sm:grid-cols-3">
        <Input
          id="goal-current"
          label="مقدار فعلی"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          dir="ltr"
          required
          error={errors.currentValue?.message}
          disabled={pending}
          {...register("currentValue")}
        />
        <Input
          id="goal-target"
          label="مقدار هدف"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          dir="ltr"
          required
          error={errors.targetValue?.message}
          disabled={pending}
          {...register("targetValue")}
        />
        <Input
          id="goal-unit"
          label="واحد"
          placeholder="کیلوگرم"
          required
          error={errors.unit?.message}
          disabled={pending}
          {...register("unit")}
        />
      </div>

      <Input
        id="goal-target-date"
        label="تاریخ هدف"
        type="date"
        required
        hint={targetDate ? jalaliLong(fromDateInputValue(targetDate)) : undefined}
        error={errors.targetDate?.message}
        disabled={pending}
        {...register("targetDate")}
      />

      <SelectField
        id="goal-status"
        label="وضعیت پیگیری"
        required
        value={status}
        onValueChange={(value) =>
          setValue("status", value as Goal["status"], {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        options={statusOptions}
        error={errors.status?.message}
        disabled={pending}
      />

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          انصراف
        </Button>
        <Button type="submit" loading={pending}>
          ذخیره هدف
        </Button>
      </div>
    </form>
  );
}
