import { LayoutDashboard, Users, UserCircle, CreditCard, DollarSign, Settings, Bell, User } from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";

export const adminNavItems: NavItem[] = [
  { label: "داشبورد", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "اعضا", href: "/admin/members", icon: <Users className="h-5 w-5" /> },
  { label: "مربیان", href: "/admin/coaches", icon: <UserCircle className="h-5 w-5" /> },
  { label: "پلن‌های اشتراک", href: "/admin/plans", icon: <CreditCard className="h-5 w-5" /> },
  { label: "پرداخت‌ها", href: "/admin/payments", icon: <DollarSign className="h-5 w-5" /> },
  { label: "اطلاع‌رسانی", href: "/admin/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "پروفایل", href: "/admin/profile", icon: <User className="h-5 w-5" /> },
  { label: "تنظیمات", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];
