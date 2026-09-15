import Navbar from "@src/components/layouts/Navbar";
import Sidebar from "@src/components/layouts/Sidebar";
import AuthGuard from "@src/components/layouts/AuthGuard";
import { SidebarProvider } from "@src/components/layouts/SidebarContext";
import React from "react";

function GuardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AuthGuard>
        <div className="flex flex-col min-h-screen lg:h-screen bg-surface text-ink text-portal">
          <Navbar />

          <div className="flex flex-1 min-h-0 relative">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    </SidebarProvider>
  );
}

export default GuardLayout;
