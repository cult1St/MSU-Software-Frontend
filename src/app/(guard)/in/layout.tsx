import Navbar from "@src/components/layouts/Navbar";
import Sidebar from "@src/components/layouts/Sidebar";
import MainStage from "@src/components/layouts/MainStage";
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
            <MainStage>{children}</MainStage>
          </div>
        </div>
      </AuthGuard>
    </SidebarProvider>
  );
}

export default GuardLayout;
