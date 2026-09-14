"use client";

import { Suspense, useEffect, useState } from "react";
import RegistrationForm from "@src/components/protocol/RegistrationForm";
import RecentRecords from "@src/components/protocol/RecentRecords";
import WaitlistTerminal from "@src/components/protocol/WaitlistTerminal";
import operationsService from "@src/services/operations.service";
import type { ServiceWindow } from "@src/dto/operations";
import { isServiceWindowOpen, serviceWindowLabel } from "@src/utils/service-window";

export default function ProtocolPage() {
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
            Unit 04: Central Medical Processing
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
          <Suspense fallback={<div className="bg-white border p-5 text-xs text-gray-400">Loading registration…</div>}>
            <RegistrationForm />
          </Suspense>
          <RecentRecords />
        </div>
        <div className="lg:col-span-1">
          <WaitlistTerminal />
        </div>
      </div>
    </div>
  );
}
