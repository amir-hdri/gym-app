import { LayoutDashboard, Users, ClipboardList, Dumbbell, FileText, MessageCircle, UserRound } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";

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
