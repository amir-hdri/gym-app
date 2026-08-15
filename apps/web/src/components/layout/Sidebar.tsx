"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { ActivityRings } from "@/components/ui/ActivityRings";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
  subItems?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ items, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (item: NavItem) => {
    if (item.active) return true;
    if (item.href === pathname) return true;
    const isPortalRoot = item.href.split("/").filter(Boolean).length === 1;
    if (!isPortalRoot && pathname.startsWith(`${item.href}/`)) return true;
    if (item.subItems?.some((sub) => sub.href === pathname || pathname.startsWith(`${sub.href}/`) || sub.active)) return true;
    return false;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside
        className={cn(
          "fixed inset-y-3 right-3 z-50 flex w-[264px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_24px_80px_-28px_rgba(71,22,66,.35)] backdrop-blur-2xl transition-transform duration-500 ease-out lg:translate-x-0 dark:border-white/10 dark:bg-brand-surface/90",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3 text-lg font-black">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-surface shadow-lg dark:bg-white/10">
              <ActivityRings className="h-8 w-8" progress={[90, 74, 82]} />
            </div>
            <div>
              <span className="block text-gradient-brand">جیم‌آپ</span>
              <span className="latin-kicker block text-muted-foreground">MOVE WITH LOVE</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors lg:hidden"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="mx-4 mb-3 rounded-2xl bg-gradient-to-l from-activity-move to-activity-stand p-[1px]">
          <div className="flex items-center gap-3 rounded-[15px] bg-white/90 px-3 py-3 dark:bg-[#1d1725]/95">
            <Sparkles className="h-4 w-4 text-primary" />
             <div><p className="text-xs font-extrabold">امروز برای تو</p><p className="text-xs text-muted-foreground">حرکت کن، بدرخش</p></div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = isActive(item);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const expanded = expandedItems.includes(item.label);

              return (
                <li key={item.label}>
                  {hasSubItems ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={cn(
                          "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-[#17121e] text-white shadow-lg shadow-purple-950/10 dark:bg-white dark:text-[#17121e]"
                            : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
                        )}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          {item.icon}
                        </span>
                        <span className="flex-1 text-right">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                        <motion.span
                          animate={{ rotate: expanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="mr-4 mt-0.5 space-y-0.5 overflow-hidden border-r border-border/60 pr-2"
                          >
                            {item.subItems!.map((sub) => {
                              const subActive = sub.href === pathname || pathname.startsWith(`${sub.href}/`) || sub.active;
                              return (
                                <li key={sub.label}>
                                  <Link
                                    href={sub.href}
                                    onClick={onClose}
                                    className={cn(
                                      "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                      subActive
                                        ? "text-primary bg-primary/5"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                  >
                                    <span className="text-right">{sub.label}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-[#17121e] text-white shadow-lg shadow-purple-950/10 dark:bg-white dark:text-[#17121e]"
                          : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                        {item.icon}
                      </span>
                      <span className="flex-1 text-right">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4">
          <p className="latin-kicker text-center text-muted-foreground">FITNESS FOR EVERY WOMAN</p>
        </div>
      </aside>
    </>
  );
}
