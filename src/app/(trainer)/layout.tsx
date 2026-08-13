"use client";
import TwilightShell, { I } from "@/components/TwilightShell";
import type { ReactNode } from "react";

const tabs = [
  { href: "/trainer/dashboard", label: "Guide", icon: I.grid },
  { href: "/trainer/members", label: "Students", icon: I.people },
  { href: "/trainer/classes", label: "Sessions", icon: I.cal },
  { href: "/trainer/progress", label: "Growth", icon: I.chart },
  { href: "/trainer/profile", label: "Profile", icon: I.user },
];

export default function TrainerLayout({ children }: { children: ReactNode }) {
  return (
    <TwilightShell tabs={tabs} homeHref="/trainer/dashboard">
      {children}
    </TwilightShell>
  );
}
