"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  CircleQuestionMark,
  Cross,
} from "lucide-react";
import { useSidebar } from "@src/components/layouts/SidebarContext";
import { cn } from "@src/lib/utils";

const topTabs = [
  { name: "Dashboard", href: "/in" },
  { name: "Protocol", href: "/in/protocol" },
  { name: "Analytics", href: "/in/admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { openSidebar, beginNavigation } = useSidebar();

  const isTabActive = (href: string) => {
    if (href === "/in") return pathname === "/in";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="flex items-center justify-between bg-white border-b border-surface-border px-4 lg:px-5 h-14 shrink-0 gap-3">
      <div className="flex items-center gap-4 lg:gap-7 min-w-0">
        <button
          type="button"
          onClick={openSidebar}
          className="lg:hidden shrink-0 text-surface-muted"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 font-bold text-sm shrink-0 text-ink">
          <span className="w-5 h-5 bg-brand-red rounded flex items-center justify-center text-white shrink-0">
            <Cross className="w-3 h-3" />
          </span>
          <span className="hidden sm:inline truncate">The Gilead Medical Portal</span>
        </div>

        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-[13px] text-surface-muted">
          {topTabs.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }
                  beginNavigation(tab.href);
                }}
                className={cn(
                  "pb-4 -mb-4 border-b-2 border-transparent transition-colors",
                  active
                    ? "text-brand-red font-semibold border-brand-red"
                    : "hover:text-ink"
                )}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2 bg-surface rounded-md px-3 py-1.5 text-surface-muted text-xs w-40 lg:w-56">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Search patient ID or protocol...</span>
        </div>

        <button
          type="button"
          className="relative w-7 h-7 rounded-full bg-surface flex items-center justify-center text-surface-muted"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-red rounded-full border border-white" />
        </button>

        <button
          type="button"
          className="hidden sm:flex w-7 h-7 rounded-full bg-surface items-center justify-center text-surface-muted"
          aria-label="Help"
        >
          <CircleQuestionMark className="w-4 h-4" />
        </button>

        <div className="w-7 h-7 rounded-full bg-surface-soft shrink-0" aria-hidden />
      </div>
    </header>
  );
}
