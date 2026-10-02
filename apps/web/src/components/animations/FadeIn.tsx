"use client";

import { ReactNode } from "react";
import { Reveal, type RevealDirection } from "./ScrollReveal";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  duration?: number;
}

export function FadeIn({ children, className, delay = 0, direction = "up", duration = 0.4 }: FadeInProps) {
  return (
    <Reveal className={className} delay={delay} direction={direction} duration={duration} offset={16}>
      {children}
    </Reveal>
  );
}

export function FadeInScale({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal className={className} delay={delay} direction="none" scale duration={0.3}>
      {children}
    </Reveal>
  );
}
