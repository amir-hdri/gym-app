"use client";

import { ArrowDown, ArrowUp, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber } from "@/lib/utils";
import type { ProgramExercise } from "@/lib/types";

interface ProgramExerciseRowProps {
  entry: ProgramExercise;
  /** 1-based position inside its day, as rendered to the coach. */
  position: number;
  isFirst: boolean;
  isLast: boolean;
  /** Any write against this program is in flight. */
  busy: boolean;
  onMove: (delta: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * One row of the program builder.
 *
 * Reordering is explicit rather than drag-based: two 44px buttons that move the
 * row one slot and write the new `order` for every affected row, so the stored
 * order always matches what is on screen. `isCompleted` is the athlete's data
 * and is shown read-only — the coach's writes never touch it.
 */
export function ProgramExerciseRow({
  entry,
  position,
  isFirst,
  isLast,
  busy,
  onMove,
  onEdit,
  onDelete,
}: ProgramExerciseRowProps) {
  const name = entry.exercise?.name ?? "حرکت حذف‌شده";

  return (
    <li className="flex flex-wrap items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 @sm:flex-nowrap @sm:items-center">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary tabular-nums"
      >
        {formatPersianNumber(position)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{name}</p>
          {entry.exercise?.muscleGroup && (
            <Badge variant="outline">{entry.exercise.muscleGroup}</Badge>
          )}
          {entry.isCompleted && (
            <Badge variant="blush">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              انجام شد
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {formatPersianNumber(entry.sets)} ست × {entry.reps} تکرار
          {entry.weight != null ? ` · ${formatPersianNumber(entry.weight)} کیلوگرم` : ""} ·{" "}
          {formatPersianNumber(entry.restSeconds)} ثانیه استراحت
        </p>
        {entry.notes && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{entry.notes}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMove(-1)}
          disabled={busy || isFirst}
          aria-label={`انتقال ${name} به یک رده بالاتر`}
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMove(1)}
          disabled={busy || isLast}
          aria-label={`انتقال ${name} به یک رده پایین‌تر`}
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          disabled={busy}
          aria-label={`ویرایش ${name}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={busy}
          aria-label={`حذف ${name} از برنامه`}
        >
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
