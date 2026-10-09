"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { homeForRole, panelLabelForRole } from "@/components/auth/auth-helpers";
import type { UserRole } from "@/lib/types";
import { Loading } from "@/components/ui/DataState";
import { Button } from "@/components/ui/Button";

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
    }
    // NOTE: role mismatch no longer auto-redirects — the 403 view below
    // explains the situation and links back to the caller's own panel.
  }, [user, isLoading, redirectTo, router]);

  if (isLoading || !user) return <Loading />;
  if (roles && !roles.includes(user.role)) {
    const home = homeForRole(user.role);
    const ownPanel = panelLabelForRole(user.role);
    return (
      <div
        className="flex flex-col items-center justify-center px-6 py-20 text-center"
        role="alert"
        aria-live="polite"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">دسترسی شما به این بخش محدود است</h1>
        <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
          این صفحه برای نقش دیگری تنظیم شده است. شما با حساب {ownPanel} وارد شده‌اید؛
          برای ادامه به پنل خودتان برگردید.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href={home}>بازگشت به {ownPanel}</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
