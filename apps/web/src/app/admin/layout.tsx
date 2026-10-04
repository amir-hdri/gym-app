import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems, adminDockItems } from "./constants";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["admin", "receptionist"]}>
      <PortalLayout navItems={adminNavItems} dockItems={adminDockItems} dockId="adminDockDot">{children}</PortalLayout>
    </RequireAuth>
  );
}