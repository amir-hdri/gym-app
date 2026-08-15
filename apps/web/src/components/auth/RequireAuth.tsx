"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import type { UserRole } from "@/lib/types";
import { Loading } from "@/components/ui/DataState";

interface RequireAuthProps {
  roles?: UserRole[];
  redirectTo?: string;
  children: ReactNode;
}

export function RequireAuth({
  roles,
  redirectTo = "/auth/login",
  children,
}: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(redirectTo);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(user.role === "coach" ? "/coach" : user.role === "admin" ? "/admin" : "/athlete");
    }
  }, [user, isLoading, roles, redirectTo, router]);

  if (isLoading || !user) return <Loading />;
  if (roles && !roles.includes(user.role)) return <Loading />;

  return <>{children}</>;
}