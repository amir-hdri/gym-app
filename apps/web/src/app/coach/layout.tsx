"use client";

import * as React from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { coachNavItems } from "./constants";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["coach"]}>
      <PortalLayout navItems={coachNavItems}>{children}</PortalLayout>
    </RequireAuth>
  );
}