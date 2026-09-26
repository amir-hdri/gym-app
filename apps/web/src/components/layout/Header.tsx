"use client";

import { Menu, Bell, Flame, Sparkles } from "lucide-react";
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
    <header className={cn("liquid-glass-header sticky top-0 z-40 w-full", "pt-[env(safe-area-inset-top)]")}>
      <div className="flex h-14 items-center justify-between px-4 md:px-7 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/70 backdrop-blur-md border border-border/60 hover:bg-accent active:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
            aria-label="باز کردن منو"
            aria-controls="portal-sidebar"
          >
            <Menu className="h-[20px] w-[20px] text-foreground" strokeWidth={1.75} />
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand shadow-[0_2px_12px_hsl(var(--brand)/0.35)]">
              <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={1.75} />
            </span>
            <p className="latin-kicker">{roleLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/15 backdrop-blur-md border border-orange-500/15 px-3 py-1.5 text-xs font-semibold text-orange-400 sm:flex">
            <Flame className="h-4 w-4 fill-orange-500 text-orange-500" strokeWidth={1.75} />
            ۵ روز
          </div>
          <ThemeToggle />

          <Link
            href={notificationHref}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/70 backdrop-blur-md border border-border/60 hover:bg-accent active:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="اعلان‌ها"
          >
            <Bell className="h-[20px] w-[20px] text-foreground/90" strokeWidth={1.75} />
            <Badge
              variant="destructive"
              className="absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center border-0 bg-primary-solid px-1 text-[10px] font-bold leading-none shadow-[0_2px_8px_hsl(var(--primary)/0.5)]"
            >
              ۳
            </Badge>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-h-11 items-center gap-2 rounded-xl bg-secondary/70 backdrop-blur-md border border-border/60 p-1 pr-2 hover:bg-accent active:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8 ring-1 ring-border">
                  <AvatarFallback className="bg-gradient-to-br from-brand to-brand-2 text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground md:block max-w-[120px] truncate">
                  {fullName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-popover text-popover-foreground">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground">
                <Link href={user?.role === "admin" ? "/admin/profile" : user?.role === "coach" ? "/coach/profile" : "/athlete/profile"}>پروفایل</Link>
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground">
                  <Link href="/admin/settings">تنظیمات</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
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
