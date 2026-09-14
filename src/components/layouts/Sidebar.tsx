"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  UserRound,
  Pill,
  Shield,
  Siren,
  Settings,
  LogOut,
  Cross,
  X,
} from "lucide-react";
import { useSidebar } from "@src/components/layouts/SidebarContext";
import { useAuth } from "@src/context/auth-context";
import { cn } from "@src/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/in", icon: LayoutDashboard },
  { name: "Protocol", href: "/in/protocol", icon: Stethoscope },
  { name: "Nurses", href: "/in/nurses", icon: Users },
  { name: "Doctors", href: "/in/doctors", icon: UserRound },
  { name: "Pharmacy", href: "/in/pharmacy", icon: Pill },
  { name: "Admin", href: "/in/admin", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, closeSidebar } = useSidebar();
  const { logout } = useAuth();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-30 lg:hidden",
          open ? "block" : "hidden"
        )}
        onClick={closeSidebar}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed lg:static z-40 top-0 left-0 h-full lg:h-auto w-60 bg-sidebar text-sidebar-text flex flex-col p-3 transition-transform duration-200 shrink-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2.5 text-white px-2 pb-5 pt-1">
          <div className="w-8 h-8 bg-brand-red rounded-md flex items-center justify-center shrink-0">
            <Cross className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm">The Gilead</div>
            <div className="text-[10px] text-sidebar-muted">Medical Unit Portal</div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="ml-auto lg:hidden text-sidebar-muted"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 mt-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/in" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors",
                  isActive
                    ? "bg-brand-red text-white font-medium"
                    : "hover:bg-sidebar-hover"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 pt-3 border-t border-sidebar-border">
          <Link
            href="/in/protocol?mode=emergency"
            onClick={closeSidebar}
            className="bg-brand-red text-white rounded-lg py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-brand-reddark transition-colors"
          >
            <Siren className="w-4 h-4" />
            Emergency Entry
          </Link>

          <Link
            href="/in/admin"
            onClick={closeSidebar}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] hover:bg-sidebar-hover"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] hover:bg-sidebar-hover text-left"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
