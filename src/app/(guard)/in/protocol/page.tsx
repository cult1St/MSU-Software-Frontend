"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import RegistrationForm from "@src/components/protocol/RegistrationForm";
import RecentRecords from "@src/components/protocol/RecentRecords";
import WaitlistTerminal from "@src/components/protocol/WaitlistTerminal";
import AppLoader from "@src/components/ui/AppLoader";
import pharmacyService from "@src/services/pharmacy.service";
import type { ProtocolHandover } from "@src/dto/pharmacy";
import type { ServiceWindow } from "@src/dto/operations";
import {
  isServiceWindowOpen,
  readServiceWindow,
  serviceWindowLabel,
  type ServiceWindowAccess,
} from "@src/utils/service-window";
import { useAuth } from "@src/context/auth-context";
import { normalizeStaffRole } from "@src/utils/roles";

function ProtocolOfficerDesk() {
  const [batches, setBatches] = useState<ProtocolHandover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    pharmacyService
      .listHandovers("Pending")
      .then((rows) => {
        if (active) setBatches(rows || []);
      })
      .catch(() => {
        if (active) setBatches([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Protocol handover
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          This role can open handover batches only. Encounter, queue, and registration routes are not permitted.
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        {loading && <p className="text-xs text-gray-400">Loading handovers…</p>}
        {!loading && batches.length === 0 && (
          <p className="text-xs text-gray-400">No pending handover batches.</p>
        )}
        {batches.map((batch) => (
          <div key={batch.id} className="text-xs border-b border-gray-100 py-2">
            <div className="font-bold text-gray-900">
              {batch.patientName || "Patient"}
            </div>
            <div className="text-gray-500">{batch.itemsDescription || batch.status || "Pending"}</div>
          </div>
        ))}
        <Link
          href="/in/pharmacy"
          className="inline-flex px-3 py-2 text-[11px] font-bold uppercase bg-[#2D3134] text-white rounded-sm"
        >
          Open handover desk
        </Link>
      </div>
    </div>
  );
}

export default function ProtocolPage() {
  const { role } = useAuth();
  const apiRole = normalizeStaffRole(role);
  const canRegister = apiRole === "Registrar" || apiRole === "Nurse";
  const canTrace = apiRole === "Registrar" || apiRole === "Nurse";

  const [windowInfo, setWindowInfo] = useState<ServiceWindow | null>(null);
  const [windowAccess, setWindowAccess] = useState<ServiceWindowAccess>("loading");

  useEffect(() => {
    if (apiRole === "ProtocolOfficer") return;
    let active = true;
    readServiceWindow().then((result) => {
      if (!active) return;
      setWindowInfo(result.window);
      setWindowAccess(result.access);
    });
    return () => {
      active = false;
    };
  }, [apiRole]);

  if (apiRole === "ProtocolOfficer") {
    return <ProtocolOfficerDesk />;
  }

  const open = windowAccess === "ready" && isServiceWindowOpen(windowInfo);
  const hoursHidden = windowAccess !== "ready";

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
            hoursHidden
              ? "bg-gray-50 border-gray-200 text-gray-700"
              : open
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              hoursHidden ? "bg-gray-400" : open ? "bg-green-600" : "bg-amber-500"
            }`}
          />
          {windowAccess === "loading"
            ? "Checking consult hours"
            : windowAccess === "denied"
              ? "Consult hours are set by the Registrar"
              : open
                ? "Cold-case window open"
                : "Cold-case window closed"}
          {windowAccess === "ready" && (
            <span className="font-medium text-[10px] ml-1">
              {serviceWindowLabel(windowInfo)}
            </span>
          )}
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
