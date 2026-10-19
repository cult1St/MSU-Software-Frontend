"use client";

import { Suspense, useEffect, useState } from "react";
import RegistrationForm from "@src/components/protocol/RegistrationForm";
import RecentRecords from "@src/components/protocol/RecentRecords";
import WaitlistTerminal from "@src/components/protocol/WaitlistTerminal";
import AppLoader from "@src/components/ui/AppLoader";
import operationsService from "@src/services/operations.service";
import type { ServiceWindow } from "@src/dto/operations";
import { isServiceWindowOpen, serviceWindowLabel } from "@src/utils/service-window";
import { useAuth } from "@src/context/auth-context";
import { normalizeStaffRole } from "@src/utils/roles";

export default function ProtocolPage() {
  const { role } = useAuth();
  const apiRole = normalizeStaffRole(role);
  const canRegister = apiRole === "Registrar" || apiRole === "Nurse";
  const canTrace =
    apiRole === "Registrar" || apiRole === "ProtocolOfficer" || apiRole === "Nurse";

  const [windowInfo, setWindowInfo] = useState<ServiceWindow | null>(null);

  useEffect(() => {
    operationsService
      .getServiceWindow()
      .then(setWindowInfo)
      .catch(() => setWindowInfo(null));
  }, []);

  const open = isServiceWindowOpen(windowInfo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Protocol & Registration Desk
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {canRegister
              ? "Register patients and open encounters"
              : "Contact trace and handover follow-up"}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded text-[11px] font-bold self-start sm:self-center ${
            open
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${open ? "bg-green-600" : "bg-amber-500"}`} />
          {open ? "Cold-case window open" : "Cold-case window closed"}
          <span className="font-medium text-[10px] ml-1">{serviceWindowLabel(windowInfo)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {canRegister ? (
            <Suspense
              fallback={
                <AppLoader
                  label="Loading registration"
                  className="min-h-[14rem] rounded-xl border border-surface-border bg-white"
                />
              }
            >
              <RegistrationForm />
            </Suspense>
          ) : (
            <div className="bg-white border border-gray-200 rounded-sm p-4 text-xs text-gray-500">
              Patient registration is limited to Registrar and Nurse accounts.
              Use recent records below for contact tracing and handover notes.
            </div>
          )}
          {canTrace && <RecentRecords />}
        </div>
        <div className="lg:col-span-1">
          <WaitlistTerminal />
        </div>
      </div>
    </div>
  );
}
