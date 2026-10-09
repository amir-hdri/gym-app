"use client";

import { useId } from "react";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

/** The a11y wiring a control needs to be announced with its label and error. */
export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

export interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => React.ReactNode;
}

/**
 * Label + control + error for the controls that do not carry their own
 * (`Select`, `Textarea`, a native date input).
 *
 * `components/ui/Input.tsx` already does this internally; this is its
 * counterpart for everything else, so a form never has an error paragraph that
 * is merely *near* its field rather than associated with it
 * (DESIGN_SYSTEM §7).
 */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="mx-1 text-destructive">*</span>}
      </Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={errorId} className="flex items-center gap-1 text-xs text-destructive" role="alert">
          <span aria-hidden className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
