"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { PageTransition } from "@/components/animations/PageTransition";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";

interface PortalLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
}

export function PortalLayout({ children, navItems }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen overflow-x-hidden">
        <Sidebar
          items={navItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col lg:mr-[280px]">
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none fixed inset-0 bg-subtle-glow" />
            <div className="pointer-events-none fixed -left-32 top-1/4 h-80 w-80 rounded-full bg-violet-400/10 blur-[100px]" />
            <Header
              onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            />
            <main className="relative flex-1 px-4 pb-28 pt-5 md:px-7 md:pb-8 lg:px-10 lg:pt-7">
              <PageTransition>{children}</PageTransition>
            </main>
            <MobileBottomNavigation items={navItems} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export type { NavItem };
