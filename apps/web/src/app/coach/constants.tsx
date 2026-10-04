import { LayoutDashboard, Users, ClipboardList, Dumbbell, FileText, MessageCircle, UserRound } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";
import type { DockItem } from "@/components/twilight/DockNav";

const p = { className: "h-[22px] w-[22px]", strokeWidth: 1.75 } as const;

export const coachNavItems: NavItem[] = [
  { label: "داشبورد", href: "/coach", icon: <LayoutDashboard {...p} /> },
  { label: "شاگردان", href: "/coach/athletes", icon: <Users {...p} /> },
  { label: "برنامه‌های تمرینی", href: "/coach/programs", icon: <ClipboardList {...p} /> },
  { label: "کتابخانه تمرینات", href: "/coach/exercises", icon: <Dumbbell {...p} /> },
  { label: "الگوهای برنامه", href: "/coach/templates", icon: <FileText {...p} /> },
  { label: "پیام‌ها", href: "/coach/messages", icon: <MessageCircle {...p} /> },
  { label: "پروفایل", href: "/coach/profile", icon: <UserRound {...p} /> },
];

/** Twilight dock for the coach portal — same dock language, role icons at 30px */
export const coachDockItems: DockItem[] = [
  { href: "/coach", label: "داشبورد", icon: "dashboard" },
  { href: "/coach/athletes", label: "شاگردان", icon: "users" },
  { href: "/coach/programs", label: "برنامه‌های تمرینی", icon: "clipboard" },
  { href: "/coach/messages", label: "پیام‌ها", icon: "messages" },
  { href: "/coach/profile", label: "پروفایل", icon: "profile" },
];
