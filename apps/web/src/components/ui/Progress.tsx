"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT, useReducedMotion } from "@/lib/motion";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => {
  const reduced = useReducedMotion();
  const pct = Math.min(Math.max(value ?? 0, 0), 100);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild>
        <motion.div
          className={cn(
            // scaleX instead of width: stays on the compositor, so a list of
            // progress bars does not trigger layout on every frame.
            "origin-inline-start h-full w-full flex-1 rounded-full bg-gradient-to-l from-activity-move to-activity-stand",
            indicatorClassName
          )}
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={
            reduced ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_OUT, delay: 0.1 }
          }
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
