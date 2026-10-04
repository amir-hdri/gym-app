import { LayoutDashboard, Dumbbell, CalendarDays, Trophy, QrCode, History, CreditCard, MessageCircle, Bell, UserRound } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";
import type { DockItem } from "@/components/twilight/DockNav";
const iconProps = { className: "h-[22px] w-[22px]", strokeWidth: 1.75 } as const;

export const athleteNavItems: NavItem[] = [
  { label: "داشبورد", href: "/athlete", icon: <LayoutDashboard {...iconProps} /> },
  { label: "برنامه‌های تمرینی", href: "/athlete/programs", icon: <Dumbbell {...iconProps} /> },
  { label: "تقویم تمرینی", href: "/athlete/calendar", icon: <CalendarDays {...iconProps} /> },
  { label: "اهداف", href: "/athlete/goals", icon: <Trophy {...iconProps} /> },
  { label: "چک‌این", href: "/athlete/checkin", icon: <QrCode {...iconProps} /> },
  { label: "تاریخچه", href: "/athlete/history", icon: <History {...iconProps} /> },
  { label: "عضویت و پرداخت", href: "/athlete/membership", icon: <CreditCard {...iconProps} /> },
  { label: "پیام‌ها", href: "/athlete/messages", icon: <MessageCircle {...iconProps} /> },
  { label: "اعلان‌ها", href: "/athlete/notifications", icon: <Bell {...iconProps} /> },
  { label: "پروفایل", href: "/athlete/profile", icon: <UserRound {...iconProps} /> },
];

/** Twilight dock: the 5 reference tabs with verbatim custom SVG icons (1:1 with GymBottomNavBar) */
export const athleteDockItems: DockItem[] = [
  { href: "/athlete", label: "داشبورد خانه", icon: "home" },
  { href: "/athlete/programs", label: "برنامه‌های تمرینی", icon: "workout" },
  { href: "/athlete/checkin", label: "ورود به باشگاه", icon: "checkin" },
  { href: "/athlete/history", label: "روند پیشرفت", icon: "progress" },
  { href: "/athlete/profile", label: "پروفایل ورزشکار", icon: "athlete" },
];
