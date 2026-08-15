import { PortalLayout } from "@/components/layout/PortalLayout";
import { athleteNavItems } from "./constants";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["athlete"]}>
      <PortalLayout navItems={athleteNavItems}>{children}</PortalLayout>
    </RequireAuth>
  );
}