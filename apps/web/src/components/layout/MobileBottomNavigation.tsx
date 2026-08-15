"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
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

  return (
    <nav
      className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-5 rounded-[1.6rem] border border-white/70 bg-white/90 p-1.5 shadow-[0_18px_50px_-15px_rgba(53,20,52,.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-brand-surface/95 lg:hidden"
      aria-label="ناوبری اصلی موبایل"
    >
      {primaryItems.map((item) => {
        const active = matchesPath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-12 min-w-0 flex-col items-center gap-1 rounded-[1.1rem] px-1 py-2 text-[10px] font-bold leading-4 transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground active:bg-muted"
            )}
          >
            <span className={cn("transition-transform", active && "-translate-y-0.5")}>{item.icon}</span>
            <span className="max-w-full text-center leading-3 line-clamp-2">{item.label}</span>
            {active && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />}
          </Link>
        );
      })}

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogTrigger asChild>
          <button
            className={cn(
              "relative flex min-h-12 min-w-0 flex-col items-center gap-1 rounded-[1.1rem] px-1 py-2 text-xs font-bold transition-colors",
              moreIsActive ? "bg-primary/10 text-primary" : "text-muted-foreground active:bg-muted"
            )}
            aria-label="نمایش همه بخش‌ها"
          >
            <MoreHorizontal className={cn("h-5 w-5", moreIsActive && "-translate-y-0.5")} />
            <span>بیشتر</span>
            {moreIsActive && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />}
          </button>
        </DialogTrigger>
        <DialogContent className="bottom-0 top-auto max-h-[78dvh] w-full max-w-none translate-x-[-50%] translate-y-0 gap-0 overflow-hidden rounded-t-[2rem] border-x-0 border-b-0 bg-background/95 p-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:max-w-lg sm:rounded-[2rem]">
          <DialogHeader className="border-b border-border/60 px-6 py-5 text-right">
            <DialogTitle>همه بخش‌ها</DialogTitle>
            <DialogDescription>دسترسی سریع به تمام امکانات پنل</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {items.map((item) => {
              const active = matchesPath(pathname, item.href);
              return (
                <DialogClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-sm font-bold transition-colors",
                      active
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-border/60 bg-card/70 text-muted-foreground active:bg-muted"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
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
    </nav>
  );
}
