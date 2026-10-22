"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type SidebarContextValue = {
  open: boolean;
  navigating: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  beginNavigation: (href: string) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function pathOf(href: string) {
  return href.split("?")[0] || href;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const toggleSidebar = useCallback(() => setOpen((prev) => !prev), []);
  const beginNavigation = useCallback(
    (href: string) => {
      if (pathOf(href) === pathname) return;
      setNavigating(true);
    },
    [pathname]
  );

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const value = useMemo(
    () => ({
      open,
      navigating,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      beginNavigation,
    }),
    [open, navigating, openSidebar, closeSidebar, toggleSidebar, beginNavigation]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
