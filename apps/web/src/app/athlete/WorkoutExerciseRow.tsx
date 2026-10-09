"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle2 } from "lucide-react";
import type { ProgramExercise } from "@/lib/types";
import { cn, formatPersianNumber } from "@/lib/utils";

interface WorkoutExerciseRowProps {
  exercise: ProgramExercise;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function WorkoutExerciseRow({ exercise, checked, onCheckedChange }: WorkoutExerciseRowProps) {
  const exerciseName = exercise.exercise?.name || exercise.exerciseId;

  return (
    <motion.label
      layout
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors",
        checked
          ? "border-primary/30 bg-secondary"
          : "border-border bg-card hover:border-border"
      )}
      whileTap={{ scale: 0.995 }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="peer sr-only"
        aria-label={`علامت‌گذاری ${exerciseName} به‌عنوان انجام‌شده`}
      />
      <span
        aria-hidden="true"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary text-primary-foreground ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-checked:bg-primary"
      >
        {checked && <Check className="h-4 w-4" strokeWidth={1.75} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium text-foreground transition-all", checked && "text-muted-foreground line-through")}>
          {exerciseName}
        </p>
        <p className={cn("text-xs leading-5 text-muted-foreground", checked && "line-through")}>
          {formatPersianNumber(exercise.sets)} × {exercise.reps}
          {exercise.weight ? ` - ${formatPersianNumber(exercise.weight)} کیلوگرم` : ""}
          {" - "}
          {formatPersianNumber(exercise.restSeconds)} ثانیه استراحت
        </p>
      </div>
      {checked && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
          <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
        </motion.div>
      )}
    </motion.label>
  );
}
