"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-center text-sm font-bold leading-5 ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-l from-activity-move via-primary to-activity-stand text-white hover:brightness-110 hover:shadow-[0_10px_30px_-10px_rgba(255,45,135,.7)] shadow-[0_8px_22px_-10px_rgba(255,45,135,.65)]",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline: "border border-border/70 bg-white/60 hover:bg-white hover:border-primary/25 dark:bg-white/5 dark:hover:bg-white/10",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm",
        subtle: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10",
      },
      size: {
        default: "h-auto min-h-10 px-4 py-2",
        sm: "h-auto min-h-9 rounded-lg px-3 py-1.5 text-xs",
        lg: "h-auto min-h-11 rounded-xl px-8 py-2.5 text-base",
        xl: "h-auto min-h-12 rounded-xl px-10 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>در حال پردازش...</span>
          </>
        ) : (
          <>{children as React.ReactNode}</>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
