"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { PageTransition } from "@/components/animations/PageTransition";
import { DockNav, type DockItem } from "@/components/twilight/DockNav";

interface PortalLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  dockItems: DockItem[];
  dockId: string;
}

export function PortalLayout({ children, navItems, dockItems, dockId }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen overflow-x-hidden bg-[#07090c]">
        <Sidebar
          items={navItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col lg:mr-[280px]">
          <div className="relative flex min-h-screen flex-col">
            <Header
              onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            />
            <main className="relative flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 md:px-7 md:pb-8 lg:px-10 lg:pt-7" id="main">
              <PageTransition key={pathname}>{children}</PageTransition>
            </main>
            <DockNav items={dockItems} dotId={dockId} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export type { NavItem };
