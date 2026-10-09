"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  /** Required: the label is wired to the trigger by id, never by position. */
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Labelled Radix select with the same `label` / `error` / `hint` contract as
 * `components/ui/Input`, so a form row reads identically whichever control it
 * uses and the error is associated through `aria-describedby` / `aria-invalid`
 * (DESIGN_SYSTEM §7).
 *
 * The trigger is sized to the `Input` height (48px) rather than the primitive's
 * 40px default, which keeps it over the 44px touch floor (§2.6).
 */
export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = "انتخاب کنید",
  hint,
  error,
  disabled,
  required,
  className,
}: SelectFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="w-full space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="mx-1 text-destructive">*</span>}
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "h-12 min-h-11 rounded-2xl border-input bg-card px-4",
            error && "border-destructive focus:ring-destructive",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs text-destructive">
          <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
