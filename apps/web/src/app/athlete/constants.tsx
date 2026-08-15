import { LayoutDashboard, ClipboardList, Target, LogIn, History, CalendarDays, CreditCard, MessageSquare, Bell, User } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";

export const athleteNavItems: NavItem[] = [
  { label: "داشبورد", href: "/athlete", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "برنامه‌های تمرینی", href: "/athlete/programs", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "تقویم تمرینی", href: "/athlete/calendar", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "اهداف", href: "/athlete/goals", icon: <Target className="h-5 w-5" /> },
  { label: "چک‌این", href: "/athlete/checkin", icon: <LogIn className="h-5 w-5" /> },
  { label: "تاریخچه", href: "/athlete/history", icon: <History className="h-5 w-5" /> },
  { label: "عضویت و پرداخت", href: "/athlete/membership", icon: <CreditCard className="h-5 w-5" /> },
  { label: "پیام‌ها", href: "/athlete/messages", icon: <MessageSquare className="h-5 w-5" /> },
  { label: "اعلان‌ها", href: "/athlete/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "پروفایل", href: "/athlete/profile", icon: <User className="h-5 w-5" /> },
];
