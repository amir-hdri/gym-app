import { LayoutDashboard, Users, ClipboardList, Dumbbell, FileText, MessageSquare, User } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";

export const coachNavItems: NavItem[] = [
  { label: "داشبورد", href: "/coach", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "شاگردان", href: "/coach/athletes", icon: <Users className="h-5 w-5" /> },
  { label: "برنامه‌های تمرینی", href: "/coach/programs", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "کتابخانه تمرینات", href: "/coach/exercises", icon: <Dumbbell className="h-5 w-5" /> },
  { label: "الگوهای برنامه", href: "/coach/templates", icon: <FileText className="h-5 w-5" /> },
  { label: "پیام‌ها", href: "/coach/messages", icon: <MessageSquare className="h-5 w-5" /> },
  { label: "پروفایل", href: "/coach/profile", icon: <User className="h-5 w-5" /> },
];
