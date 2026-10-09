import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  // Reference pill language (GymCheckinScreen «ACTIVE» pill):
  // cream-tinted for positive states, muted for neutral, tinted for warn/error.
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-border bg-border text-muted-foreground",
    destructive: "border-destructive/40 bg-destructive/10 text-destructive",
    outline: "border-border text-muted-foreground",
    success: "border-primary/40 bg-primary/10 text-primary",
    warning: "border-warning/40 bg-warning/10 text-warning",
    info: "border-border bg-secondary text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
