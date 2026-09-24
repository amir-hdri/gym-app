"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Sparkles } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

interface MobileBottomNavigationProps {
  items: NavItem[];
}

function matchesPath(pathname: string, href: string) {
  const isPortalRoot = href.split("/").filter(Boolean).length === 1;
  return pathname === href || (!isPortalRoot && pathname.startsWith(`${href}/`));
}

export function MobileBottomNavigation({ items }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = items.slice(0, 4);
  const moreIsActive = !primaryItems.some((item) => matchesPath(pathname, item.href));

  const handleHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as any).vibrate(10); } catch (_e) { void _e; }
    }
  };

  return (
    <nav
      className="liquid-glass-tabbar fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="ناوبری اصلی موبایل"
    >
      <div className="grid grid-cols-5 items-center gap-0 px-1.5 pt-2 pb-1.5">
        {primaryItems.map((item) => {
          const active = matchesPath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={handleHaptic}
              className={cn(
                "group flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary" : "text-muted-foreground active:text-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200",
                  active
                    ? "bg-primary/15 shadow-[0_2px_12px_hsl(var(--primary)/0.25)] scale-[1.05]"
                    : "group-active:bg-accent group-active:scale-[0.96]"
                )}
              >
                <span className={cn("transition-transform", active && "scale-[1.05]")}>{item.icon}</span>
              </span>
              <span className="text-[10px] font-semibold leading-none tracking-wide">{item.label}</span>
            </Link>
          );
        })}
        <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
          <DialogTrigger asChild>
            <button
              onClick={handleHaptic}
              className={cn(
                "group flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                moreIsActive ? "text-primary" : "text-muted-foreground active:text-foreground"
              )}
              aria-label="نمایش همه بخش‌ها"
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-xl transition-all",
                  moreIsActive ? "bg-primary/15 shadow-[0_2px_12px_hsl(var(--primary)/0.25)]" : "group-active:bg-accent"
                )}
              >
                <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.75} />
              </span>
              <span className="text-[10px] font-semibold leading-none tracking-wide">بیشتر</span>
            </button>
          </DialogTrigger>
          <DialogContent className="bottom-0 top-auto max-h-[78dvh] w-full max-w-none translate-x-[-50%] translate-y-0 gap-0 overflow-hidden rounded-t-[1.75rem] border-x-0 border-b-0 border-t border-border bg-popover/95 backdrop-blur-[32px] p-0 text-popover-foreground data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:max-w-lg sm:rounded-[1.5rem]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <DialogHeader className="relative border-b border-border/60 px-6 py-5 text-right">
              <DialogTitle className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
                </span>
                همه بخش‌ها
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">دسترسی سریع به تمام امکانات پنل</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2.5 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-transparent">
              {items.map((item) => {
                const active = matchesPath(pathname, item.href);
                return (
                  <DialogClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={handleHaptic}
                      className={cn(
                        "group flex min-h-[60px] items-center gap-3 rounded-2xl border p-3.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary/20 bg-primary/10 text-primary shadow-[0_4px_20px_hsl(var(--primary)/0.15)]"
                          : "border-border/60 bg-secondary/40 backdrop-blur-md text-foreground hover:bg-accent hover:border-border active:bg-secondary"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                          active ? "bg-primary/15" : "bg-foreground/10 group-hover:bg-foreground/15"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right text-[13px] font-semibold">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.4)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </DialogClose>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}
