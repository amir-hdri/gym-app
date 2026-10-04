"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  glass?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, glass: _glass, id, rows = 3, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-[#8e98a8]">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          rows={rows}
          className={cn(
            "flex min-h-[80px] w-full resize-y rounded-xl border border-[#232934] bg-[#161a22] px-4 py-2.5 text-sm text-white placeholder:text-[#6b7280] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#d2c0a5]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-destructive focus-visible:border-destructive/60",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
