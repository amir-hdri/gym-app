"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  gradient?: string;
  className?: string;
}

export function AnimatedProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  gradient = "from-activity-move via-primary to-activity-stand",
  className,
}: AnimatedProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayProgress(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const heightMap = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted/60 ring-1 ring-inset ring-border/50",
          heightMap[size]
        )}
      >
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          {/* Shimmer effect */}
          <div className="relative h-full w-full overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
            />
          </div>
        </motion.div>
      </div>
      {showLabel && (
        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(displayProgress)}%</span>
          <span>
            {value.toLocaleString("fa-IR")} / {max.toLocaleString("fa-IR")}
          </span>
        </div>
      )}
    </div>
  );
}
