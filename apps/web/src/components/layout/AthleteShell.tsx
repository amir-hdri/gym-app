"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortalBadgeCounts } from "./use-portal-badges";
import { LumiLogo } from "@/components/ui/LumiLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  HomeNavIcon,
  WorkoutNavIcon,
  CheckinNavIcon,
  ProgressNavIcon,
  AthleteNavIcon,
} from "@/components/twilight/GymNavIcons";
import { partitionNav, type NavIconName, type NavItem } from "./nav-items";

/**
 * Dock glyphs arrive as names, because these lists are built in Server
 * Components and a component *function* cannot cross the RSC boundary. The
 * registry therefore lives here, on the client.
 */
const DOCK_ICONS: Record<NavIconName, ComponentType<{ isActive?: boolean }>> = {
  home: HomeNavIcon,
  workout: WorkoutNavIcon,
  checkin: CheckinNavIcon,
  progress: ProgressNavIcon,
  athlete: AthleteNavIcon,
};

/**
 * Portal shell: a fixed dock, a header that opens a full drawer, and the page
 * body.
 *
 * Both navigation surfaces derive from the portal's single `navItems` list via
 * `partitionNav`. They used to be a hand-copied table per role that had
 * drifted from the drawer — the dock said "داشبورد خانه" where the drawer said
 * "داشبورد", and five of the athlete's ten routes were invisible in the dock.
 */
export function AthleteShell({
  children,
  navItems,
}: {
  children: ReactNode;
  navItems: NavItem[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const badges = usePortalBadgeCounts();

  const { dock, sheet } = partitionNav(navItems);
  const portalRoot = navItems[0]?.href ?? "";

  const isCurrent = (href: string) =>
    pathname === href || (href !== portalRoot && pathname.startsWith(`${href}/`));

  // A user persisted by an older build can lack the name fields; without the
  // nullish fallbacks the header renders the literal text "undefined undefined".
  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "کاربر"
    : "کاربر";
  const unread = badges.notifications + badges.messages;

  return (
    <div className="twilight-stage">
      <div className="athlete-shell">
        <header className="twilight-header" dir="ltr">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="نمایش همه بخش‌ها"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="ring-focus flex min-w-0 items-center gap-2 rounded-md"
          >
            <span className="twilight-status-dot" aria-hidden />
            <LumiLogo size="sm" variant="auto" showSubtitle={false} ariaLabel="Lumi Wellness — all sections" />
            <span className="truncate text-xs font-normal text-muted-foreground">
              · {displayName}
            </span>
            {unread > 0 && (
              <span className="sr-only">پیام یا اعلان خوانده‌نشده</span>
            )}
          </button>
          <ThemeToggle />
        </header>
        <main id="main" className="twilight-main @container">
          {children}
        </main>
        {dock.length > 0 && (
          <nav className="twilight-dock" aria-label="ناوبری اصلی" dir="ltr">
            {dock.map(({ href, label, dockIcon }) => {
              const Icon = dockIcon ? DOCK_ICONS[dockIcon] : undefined;
              if (!Icon) return null;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  aria-current={isCurrent(href) ? "page" : undefined}
                  className={`twilight-tab ring-focus ${isCurrent(href) ? "is-active" : ""}`}
                >
                  <Icon isActive={isCurrent(href)} />
                  <span className="twilight-nav-dot" />
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      <Sheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="همه بخش‌ها"
        description="دسترسی به بخش‌های حساب شما"
      >
        <div className="grid grid-cols-2 gap-3">
          {sheet.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={`ring-focus flex items-center gap-3 rounded-2xl border p-4 text-xs ${
                isCurrent(item.href)
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-muted/40"
              }`}
            >
              <span aria-hidden className="shrink-0">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </Sheet>
    </div>
  );
}