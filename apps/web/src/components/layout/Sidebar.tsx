"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
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

/**
 * Twilight Meditation sidebar — dark panel in the reference language:
 * hairline borders, cream active treatment, muted rows.
 */
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
            className="fixed inset-0 z-40 bg-scrim/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside
        id="portal-sidebar"
        className={cn(
          "fixed inset-y-3 right-3 z-50 flex w-[264px] flex-col overflow-hidden rounded-[2rem] border border-border bg-background shadow-[0_24px_80px_-28px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Logo — reference wordmark */}
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2" aria-label="Lumi Wellness">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_80%,transparent)]" />
            <span className="font-serif text-lg font-semibold tracking-tight text-foreground">لومی</span>
            <span dir="ltr" className="pt-0.5 text-[10px] font-normal tracking-widest text-muted-foreground">
              LUMI
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {items.map((item, index) => {
              const active = isActive(item);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const expanded = expandedItems.includes(item.label);
              const submenuId = `sidebar-sub-${index}`;

              const rowClass = cn(
                "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border border-primary/25 bg-secondary text-foreground"
                  : "border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
              );

              return (
                <li key={item.label}>
                  {hasSubItems ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        aria-expanded={expanded}
                        aria-controls={submenuId}
                        className={rowClass}
                      >
                        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", active ? "text-primary" : "")}>
                          {item.icon}
                        </span>
                        <span className="flex-1 text-right">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 font-sans text-xs font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.ul
                            id={submenuId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="mr-4 mt-0.5 space-y-0.5 overflow-hidden border-r border-border pr-2"
                          >
                            {item.subItems!.map((sub) => {
                              const subActive = sub.href === pathname || pathname.startsWith(`${sub.href}/`) || sub.active;
                              return (
                                <li key={sub.label}>
                                  <Link
                                    href={sub.href}
                                    onClick={onClose}
                                    className={cn(
                                      "relative flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                      subActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                    <Link href={item.href} onClick={onClose} className={rowClass}>
                      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", active ? "text-primary" : "")}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-right">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 font-sans text-xs font-bold text-primary-foreground">
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
        <div className="border-t border-border p-4">
          <p dir="ltr" className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Lumi Wellness
          </p>
        </div>
      </aside>
    </>
  );
}
