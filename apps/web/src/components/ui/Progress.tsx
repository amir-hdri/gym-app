"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator asChild>
      <motion.div
        className={cn("h-full w-full flex-1 rounded-full bg-gradient-to-l from-activity-move to-activity-stand shadow-[0_0_10px_rgba(255,45,135,.35)]", indicatorClassName)}
        initial={{ width: "0%" }}
        animate={{ width: `${value || 0}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ transformOrigin: "right" }}
      />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
