"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input on its inline-start side (right in RTL). */
  startAdornment?: React.ReactNode;
  /** Rendered inside the input on its inline-end side (left in RTL). */
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, startAdornment, endAdornment, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-muted-foreground"
          >
            {label}
            {props.required && <span className="text-destructive mx-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-11 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors",
              startAdornment && "ps-11",
              endAdornment && "pe-11",
              error
                ? "border-destructive focus-visible:border-destructive/60"
                : "",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            ref={ref}
            {...props}
          />
          {startAdornment && (
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground" aria-hidden="true">
              {startAdornment}
            </span>
          )}
          {endAdornment && (
            <span className="absolute inset-y-0 end-3 flex items-center">
              {endAdornment}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-destructive flex items-center gap-1" role="alert">
            <span className="inline-block h-1 w-1 rounded-full bg-destructive shrink-0" />
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
);
Input.displayName = "Input";

export { Input };
