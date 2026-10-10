"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageCircle,
  UserRound,
  DollarSign,
  Bell,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HomeNavIcon,
  WorkoutNavIcon,
  CheckinNavIcon,
  ProgressNavIcon,
  AthleteNavIcon,
} from "./dock-icons";

/**
 * Serializable dock icon ids — the registry lives in this client component so
 * icon render functions never cross the server→client boundary.
 */
export type DockIconKind =
  | "home"
  | "workout"
  | "checkin"
  | "progress"
  | "athlete"
  | "dashboard"
  | "users"
  | "clipboard"
  | "dumbbell"
  | "messages"
  | "profile"
  | "dollar"
  | "bell";

export interface DockItem {
  href: string;
  label: string;
  icon: DockIconKind;
}

const LUCIDE_ICON_CLASS = "h-[30px] w-[30px]";
const SVG_ICON_CLASS = "h-[30px] w-[30px]";

const ICON_REGISTRY: Record<DockIconKind, (active: boolean) => ReactNode> = {
  home: (active) => <HomeNavIcon className={SVG_ICON_CLASS} isActive={active} />,
  workout: (active) => <WorkoutNavIcon className={SVG_ICON_CLASS} isActive={active} />,
  checkin: (active) => <CheckinNavIcon className={SVG_ICON_CLASS} isActive={active} />,
  progress: (active) => <ProgressNavIcon className={SVG_ICON_CLASS} isActive={active} />,
  athlete: (active) => <AthleteNavIcon className={SVG_ICON_CLASS} isActive={active} />,
  dashboard: () => <LayoutDashboard className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
  users: () => <Users className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
  clipboard: () => <ClipboardList className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
  dumbbell: () => <Dumbbell className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
  messages: () => <MessageCircle className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
  profile: () => <UserRound className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
  dollar: () => <DollarSign className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
  bell: () => <Bell className={LUCIDE_ICON_CLASS} strokeWidth={1.6} />,
};

function matchesPath(pathname: string, href: string) {
  if (pathname === href) return true;
  const isPortalRoot = href.split("/").filter(Boolean).length === 1;
  return !isPortalRoot && pathname.startsWith(`${href}/`);
}

/**
 * Twilight Meditation floating bottom dock — port of the reference
 * GymBottomNavBar: fixed pill `bg-popover/94 backdrop-blur-2xl
 * border-border rounded-[36px]`, 330px × 65px, 30px icons, active icon
 * cream #ded1bc with glow + spring scale, gliding active dot (layoutId).
 */
export function DockNav({ items, dotId }: { items: DockItem[]; dotId: string }) {
  const pathname = usePathname();

  const handleHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        (navigator as unknown as { vibrate: (p: number) => void }).vibrate(10);
      } catch {
        /* noop */
      }
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 select-none lg:hidden">
      <nav
        aria-label="ناوبری اصلی موبایل"
        className="pointer-events-auto mx-auto flex h-[65px] w-[330px] max-w-[calc(100vw-2rem)] items-center justify-around rounded-[36px] border border-border bg-popover/94 px-3 shadow-[0_18px_44px_color-mix(in_srgb,var(--color-scrim)_75%,transparent)] backdrop-blur-2xl"
      >
        {items.map((item) => {
          const isActive = matchesPath(pathname, item.href);
          const renderIcon = ICON_REGISTRY[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              onClick={handleHaptic}
              className="group relative flex h-12 w-12 cursor-pointer flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover rounded-2xl"
            >
              <motion.span
                animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1.5 : 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={cn(
                  "relative z-10 transition-colors duration-200",
                  isActive
                    ? "text-primary drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {renderIcon(isActive)}
              </motion.span>
              <span className="relative z-10 mt-1 flex h-1 w-full items-center justify-center">
                {isActive && (
                  <motion.span
                    layoutId={dotId}
                    className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_95%,transparent)]"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  />
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
