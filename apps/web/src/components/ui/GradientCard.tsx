"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: string;
  glowOnHover?: boolean;
  floating?: boolean;
}

const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  ({ className, children, gradient = "from-activity-move/70 via-activity-stand/40 to-transparent", glowOnHover = true, floating = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-[var(--shadow-card)]",
          "dark:border-white/[0.08] dark:bg-gray-900/60 dark:shadow-[var(--shadow-card)]",
          glowOnHover && "hover:shadow-[var(--shadow-card-hover)] hover:border-primary/20 transition-all duration-500",
          className
        )}
        whileHover={floating ? { y: -4, transition: { duration: 0.3, ease: "easeOut" } } : undefined}
        {...(props as any)}
      >
        {/* Top gradient line */}
        <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r", gradient)} />

        {/* Subtle background gradient */}
        <div
          className="absolute inset-0 opacity-[0.03] bg-gradient-to-br from-primary/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);
GradientCard.displayName = "GradientCard";

export { GradientCard };
