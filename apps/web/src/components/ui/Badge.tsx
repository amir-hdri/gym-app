import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  // Reference pill language (GymCheckinScreen «ACTIVE» pill):
  // cream-tinted for positive states, muted for neutral, tinted for warn/error.
  const variants = {
    default: "border-transparent bg-[#d2c0a5] text-[#121417]",
    secondary: "border-[#2b3342] bg-[#1e2430] text-[#9ca3af]",
    destructive: "border-[#f87171]/40 bg-[#f87171]/10 text-[#f87171]",
    outline: "border-[#2b3342] text-[#8e98a8]",
    success: "border-[#d2c0a5]/40 bg-[#d2c0a5]/10 text-[#d2c0a5]",
    warning: "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fbbf24]",
    info: "border-white/10 bg-[#202632] text-[#9ca3af]",
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
