"use client";

import { Menu, Bell, Flame } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";
  const notificationHref = user?.role === "admin"
    ? "/admin/notifications"
    : user?.role === "coach"
      ? "/coach/messages"
      : "/athlete/notifications";
  const roleLabel = user?.role === "admin" ? "CLUB CONTROL" : user?.role === "coach" ? "COACH STUDIO" : "MY FITNESS";

  return (
    <header className={cn("sticky top-0 z-30 w-full px-4 pt-3 md:px-7 lg:px-10")}>
      <div className="flex h-16 items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3 shadow-[0_12px_40px_-30px_rgba(50,20,50,.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-brand-surface/75 md:px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <p className="latin-kicker">{roleLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-extrabold text-orange-600 sm:flex">
            <Flame className="h-4 w-4 fill-orange-500" /> ۵ روز
          </div>
          <ThemeToggle />

          <Link
            href={notificationHref}
            className="relative rounded-full p-2 transition-colors hover:bg-muted"
            aria-label="اعلان‌ها"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Badge
              variant="destructive"
              className="absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center px-1 text-[10px] leading-none"
            >
              ۳
            </Badge>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 hover:bg-muted transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-activity-move to-activity-stand text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:block max-w-[120px] truncate">
                  {fullName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={user?.role === "admin" ? "/admin/profile" : user?.role === "coach" ? "/coach/profile" : "/athlete/profile"}>پروفایل</Link>
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">تنظیمات</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={logout}
              >
                خروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
