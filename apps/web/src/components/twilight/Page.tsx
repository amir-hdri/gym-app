"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Twilight Meditation page primitives — exact port of the reference screen
 * wrapper patterns (Gym*Screen.tsx):
 * - PageShell: motion.div initial{opacity:0,y:10} → animate{opacity:1,y:0},
 *   0.35s, ease [0.16,1,0.3,1], "flex flex-col gap-6 pb-6 select-none"
 * - PageHeader / SectionTitle / MicroLabel / MicroLabelFa live in ./Type
 *   (motion-free, safe for the landing critical path) and are re-exported
 *   here so existing portal imports keep working.
 */

export { PageHeader, SectionTitle, MicroLabel, MicroLabelFa } from "./Type";

const EASE = [0.16, 1, 0.3, 1] as const;

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={cn("flex flex-col gap-6 pb-6 text-foreground select-none", className)}
    >
      {children}
    </motion.div>
  );
}
