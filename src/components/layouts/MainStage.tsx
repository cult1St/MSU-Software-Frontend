"use client";

import type { ReactNode } from "react";
import AppLoader from "@src/components/ui/AppLoader";
import { useSidebar } from "@src/components/layouts/SidebarContext";

export default function MainStage({ children }: { children: ReactNode }) {
  const { navigating } = useSidebar();

  return (
    <main className="relative flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
      {children}
      {navigating && (
        <div className="absolute inset-0 z-20 flex bg-surface">
          <AppLoader
            label="Loading page"
            showLabel
            className="min-h-full"
          />
        </div>
      )}
    </main>
  );
}
