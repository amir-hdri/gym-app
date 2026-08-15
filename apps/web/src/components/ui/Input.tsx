"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground/80"
          >
            {label}
            {props.required && <span className="text-destructive mx-1">*</span>}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-12 w-full rounded-2xl border px-4 py-2.5 text-sm",
            "bg-white/65 dark:bg-white/5 file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "shadow-inner shadow-black/[0.02] transition-all duration-300",
            "border-border/80",
            error 
              ? "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive/40" 
              : "",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          ref={ref}
          {...props}
        />
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
