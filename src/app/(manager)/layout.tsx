"use client";
import TwilightShell, { I } from "@/components/TwilightShell";
import type { ReactNode } from "react";

const tabs = [
  { href: "/manager/dashboard", label: "Studio", icon: I.grid },
  { href: "/manager/members", label: "Members", icon: I.people },
  { href: "/manager/classes", label: "Sessions", icon: I.cal },
  { href: "/manager/payments", label: "Billing", icon: I.card },
  { href: "/manager/settings", label: "Settings", icon: I.gear },
];

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <TwilightShell tabs={tabs} homeHref="/manager/dashboard">
      {children}
    </TwilightShell>
  );
}
