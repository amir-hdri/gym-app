"use client";

import { Menu, Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications } from "@/hooks/use-api";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { LumiLogo } from "@/components/ui/LumiLogo";
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

/**
 * Twilight Meditation portal header — port of the reference App header:
 * cream dot + wordmark, hairline bottom border, bell with real unread badge,
 * avatar menu. Dark-only (no theme toggle).
 */
export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { data: notificationsData } = useNotifications(user?.id);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";
  const notifications =
    notificationsData && !Array.isArray(notificationsData) ? (notificationsData.data ?? []) : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const notificationHref =
    user?.role === "admin"
      ? "/admin/notifications"
      : user?.role === "coach"
        ? "/coach/messages"
        : "/athlete/notifications";
  const profileHref =
    user?.role === "admin" ? "/admin/profile" : user?.role === "coach" ? "/coach/profile" : "/athlete/profile";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.04] bg-[#0c0e12]/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between px-4 md:px-7 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1b222c] text-white transition-colors hover:bg-[#252d3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="باز کردن منو"
            aria-controls="portal-sidebar"
          >
            <Menu className="h-[20px] w-[20px]" strokeWidth={1.75} />
          </button>
          <LumiLogo
            variant="auto"
            size="xs"
            showSubtitle={false}
            ariaLabel="Lumi Wellness"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={notificationHref}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1b222c] text-white transition-colors hover:bg-[#252d3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`اعلان‌ها${unreadCount > 0 ? `، ${unreadCount} خوانده‌نشده` : ""}`}
          >
            <Bell className="h-[20px] w-[20px]" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d2c0a5] px-1 font-sans text-[10px] font-bold leading-none text-[#121417] shadow-[0_2px_8px_rgba(210,192,165,0.5)]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#1b222c] p-1 pl-2 transition-colors hover:bg-[#252d3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8 ring-1 ring-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-[#2a3444] to-[#141a22] font-serif text-xs font-bold text-[#d2c0a5]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate font-sans text-sm font-medium text-white md:block">
                  {fullName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-white/10 bg-[#10141a] text-white">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white">{fullName}</span>
                  <span className="text-xs text-[#8e98a8]">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="focus:bg-[#1a202a] focus:text-white">
                <Link href={profileHref}>پروفایل</Link>
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem asChild className="focus:bg-[#1a202a] focus:text-white">
                  <Link href="/admin/settings">تنظیمات</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="text-[#f87171] focus:bg-[#f87171]/10 focus:text-[#f87171]"
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
