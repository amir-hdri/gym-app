import { LayoutDashboard, Users, UserCircle2, CreditCard, DollarSign, Settings2, Bell, UserRound } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";
import type { DockItem } from "@/components/twilight/DockNav";

const p = { className: "h-[22px] w-[22px]", strokeWidth: 1.75 } as const;

export const adminNavItems: NavItem[] = [
  { label: "داشبورد", href: "/admin", icon: <LayoutDashboard {...p} /> },
  { label: "اعضا", href: "/admin/members", icon: <Users {...p} /> },
  { label: "مربیان", href: "/admin/coaches", icon: <UserCircle2 {...p} /> },
  { label: "پلن‌های اشتراک", href: "/admin/plans", icon: <CreditCard {...p} /> },
  { label: "پرداخت‌ها", href: "/admin/payments", icon: <DollarSign {...p} /> },
  { label: "اطلاع‌رسانی", href: "/admin/notifications", icon: <Bell {...p} /> },
  { label: "پروفایل", href: "/admin/profile", icon: <UserRound {...p} /> },
  { label: "تنظیمات", href: "/admin/settings", icon: <Settings2 {...p} /> },
];

/** Twilight dock for the admin portal — same dock language, role icons at 30px */
export const adminDockItems: DockItem[] = [
  { href: "/admin", label: "داشبورد", icon: "dashboard" },
  { href: "/admin/members", label: "اعضا", icon: "users" },
  { href: "/admin/payments", label: "پرداخت‌ها", icon: "dollar" },
  { href: "/admin/notifications", label: "اطلاع‌رسانی", icon: "bell" },
  { href: "/admin/profile", label: "پروفایل", icon: "profile" },
];
