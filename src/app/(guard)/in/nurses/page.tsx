"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import PatientBanner from "@src/components/consultation/PatientBanner";
import VitalTelemetry from "@src/components/consultation/VitalTelemetry";
import { VitalMetrics, PatientHeaderInfo } from "@src/types/consultation";
import type { Encounter, EncounterVitals } from "@src/dto/encounter";
import type { DressingOrder } from "@src/dto/lab";
import { getStaffId, isUuid, requireStaffId } from "@src/utils/staff";
import encountersService from "@src/services/encounters.service";
import patientsService from "@src/services/patients.service";
import operationsService from "@src/services/operations.service";
import labService from "@src/services/lab.service";
import { getApiErrorMessage } from "@src/utils/api-error";
import { useAuth } from "@src/context/auth-context";
import { nurseSections } from "@src/utils/roles";

const emptyVitals: VitalMetrics = {
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  pulseRate: "",
  temperatureCelsius: "",
  weightKg: "",
  spo2: "",
  respiratoryRate: "",
  notes: "",
};

function toNumber(value: number | "") {
  return value === "" ? null : value;
}

function isEmergencyEncounter(item: Encounter) {
  return String(item.admissionType || "").toLowerCase().includes("emergency");
}

function encounterLabel(item: Encounter) {
  return item.patientName || item.fullName || item.id.slice(0, 8);
}

export default function NursesStationPage() {
  const { role, staffId } = useAuth();
  const sections = nurseSections(role);
  const [bpQueue, setBpQueue] = useState<Encounter[]>([]);
  const [emergencyQueue, setEmergencyQueue] = useState<Encounter[]>([]);
  const [openQueue, setOpenQueue] = useState<Encounter[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [patient, setPatient] = useState<PatientHeaderInfo | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [vitals, setVitals] = useState<VitalMetrics>(emptyVitals);
  const [vitalsHistory, setVitalsHistory] = useState<EncounterVitals[]>([]);
  const [dressingOrders, setDressingOrders] = useState<DressingOrder[]>([]);
  const [selectedDressing, setSelectedDressing] = useState<DressingOrder | null>(null);
  const [procedureNotes, setProcedureNotes] = useState("");

  const loadBoard = useCallback(async () => {
    try {
      const [bp, admitted, inTreatment, registered, queued, emergencies] =
        await Promise.all([
          encountersService.listByStatus("BpCheck").catch(() => []),
          encountersService.listByStatus("Admitted").catch(() => []),
          encountersService.listByStatus("InTreatment").catch(() => []),
          encountersService.listByStatus("Registered").catch(() => []),
          encountersService.listByStatus("Queued").catch(() => []),
          encountersService.list({ type: "Emergency" }).catch(() => []),
        ]);
      const merged = new Map<string, Encounter>();
      [bp, admitted, inTreatment, registered, queued, emergencies]
        .flat()
        .forEach((item) => {
          if (item?.id) merged.set(item.id, item);
        });
      const all = Array.from(merged.values()).filter(
        (item) => item.status !== "Discharged" && item.status !== "Referred"
      );
      const bpList = all.filter(
        (item) => item.status === "BpCheck" && !isEmergencyEncounter(item)
      );
      const emergencyList = all.filter((item) => isEmergencyEncounter(item));
      const used = new Set(
        [...bpList, ...emergencyList].map((item) => item.id)
      );
      const openList = all.filter((item) => !used.has(item.id));
      setBpQueue(bpList);
      setEmergencyQueue(emergencyList);
      setOpenQueue(openList);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load nurse board"));
    }
  }, []);

  const loadDressing = useCallback(async () => {
    try {
      const [pending, inProgress] = await Promise.all([
        labService.listDressingOrders("Pending").catch(() => []),
        labService.listDressingOrders("InProgress").catch(() => []),
      ]);
      setDressingOrders([...(pending || []), ...(inProgress || [])]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load dressing orders"));
    }
  }, []);

  useEffect(() => {
    void loadBoard();
    void loadDressing();
  }, [loadBoard, loadDressing]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;

    async function hydrate() {
      try {
        const chart = await encountersService.getChart(selectedId);
        if (!active) return;
        const detail = chart.encounter;
        setEncounter(detail);

        const person = chart.patient;
        let header: PatientHeaderInfo = {
          id: detail.patientId || detail.id,
          name: detail.patientName || detail.fullName || person?.fullName || "Patient",
          dob: "—",
          age: person?.age || 0,
          gender:
            person?.sex === "M" ? "Male" : person?.sex === "F" ? "Female" : "Other",
          bloodType: "—",
          phone: person?.phone || "—",
          lastVisit: detail.createdAt
            ? new Date(detail.createdAt).toLocaleDateString()
            : "—",
        };
        if (!person && detail.patientId) {
          try {
            const fetched = await patientsService.getById(detail.patientId);
            if (fetched) {
              header = {
                ...header,
                id: fetched.id,
                name: fetched.fullName || header.name,
                age: fetched.age || 0,
                gender:
                  fetched.sex === "M"
                    ? "Male"
                    : fetched.sex === "F"
                      ? "Female"
                      : "Other",
                phone: fetched.phone || "—",
              };
            }
          } catch {
            // Encounter still usable without patient profile.
          }
        }
        if (!active) return;
        setPatient(header);

        const history = chart.vitals?.length
          ? chart.vitals
          : await encountersService.getVitals(selectedId).catch(() => []);
        if (active) setVitalsHistory(history || []);

        const latest =
          (history && history[history.length - 1]) ||
          (await encountersService.getLatestVitals(selectedId).catch(() => null));
        if (!active) return;
        if (!latest) {
          setVitals(emptyVitals);
          return;
        }
        setVitals({
          bloodPressureSystolic: latest.bloodPressureSystolic ?? "",
          bloodPressureDiastolic: latest.bloodPressureDiastolic ?? "",
          pulseRate: latest.pulseRate ?? "",
          temperatureCelsius: latest.temperature ?? "",
          weightKg: latest.weight ?? "",
          spo2: latest.spo2 ?? "",
          respiratoryRate: latest.respiratoryRate ?? "",
          notes: latest.notes || "",
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load encounter"));
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleSaveVitals = async () => {
    if (!selectedId) {
      toast.error("Select an encounter before recording vitals.");
      return false;
    }
    try {
      const recordedBy = isUuid(staffId)
        ? staffId
        : requireStaffId("nurse", "recordedBy");
      await encountersService.recordVitals(selectedId, {
        recordedBy,
        bloodPressureSystolic: toNumber(vitals.bloodPressureSystolic),
        bloodPressureDiastolic: toNumber(vitals.bloodPressureDiastolic),
        pulseRate: toNumber(vitals.pulseRate),
        temperature: toNumber(vitals.temperatureCelsius),
        spo2: toNumber(vitals.spo2),
        respiratoryRate: toNumber(vitals.respiratoryRate),
        weight: toNumber(vitals.weightKg),
        notes: vitals.notes || null,
      });
      const history = await encountersService.getVitals(selectedId).catch(() => []);
      setVitalsHistory(history || []);
      toast.success("Vitals recorded");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to record vitals"));
      return false;
    }
  };

  const sendToDoctorQueue = async () => {
    if (!selectedId) {
      toast.error("Select an encounter before recording vitals.");
      return;
    }
    try {
      const saved = await handleSaveVitals();
      if (!saved) return;
      await encountersService.updateStatus(selectedId, { status: "Queued" });
      await operationsService.joinQueue(selectedId);
      toast.success("BP recorded. Patient sent to the doctor queue.");
      setSelectedId("");
      void loadBoard();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to send to queue"));
    }
  };

  const openDressing = async (orderId: string) => {
    try {
      const order = await labService.getDressingOrder(orderId);
      setSelectedDressing(order);
      setProcedureNotes("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load dressing order"));
    }
  };

  const completeDressing = async () => {
    if (!selectedDressing) return;
    try {
      const performedBy =
        getStaffId("dressingNurse") || getStaffId("nurse");
      if (!isUuid(performedBy)) {
        throw new Error("Sign in as Nurse or Dressing Nurse to complete this.");
      }
      await labService.completeDressing(selectedDressing.id, {
        performedBy,
        procedureNotes: procedureNotes || null,
      });
      toast.success("Dressing / injection completed");
      setSelectedDressing(null);
      void loadDressing();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to complete dressing"));
    }
  };

  const isBpCase = encounter?.status === "BpCheck";
  const isEmergency = encounter ? isEmergencyEncounter(encounter) : false;
  const boardGroups = [
    { label: "BP desk (age over 40)", items: bpQueue },
    { label: "Emergency ward", items: emergencyQueue },
    { label: "Open encounters", items: openQueue },
  ];
  const boardEmpty = boardGroups.every((group) => group.items.length === 0);

  return (
    <div className="space-y-6 flex flex-col justify-between min-h-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Nurses Station</h1>
          <p className="text-xs text-surface-muted">
            Record vitals here. Add new patients from Protocol in the sidebar.
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-sm p-3 space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-surface-muted">
            Select encounter
          </h2>
          {boardEmpty && (
            <p className="text-xs text-gray-400">
              No open encounters yet. Open Protocol to register a patient, then refresh this board.
            </p>
          )}
          {boardGroups.map((group) =>
            group.items.length === 0 ? null : (
              <div key={group.label} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const active = selectedId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`text-left text-xs px-2.5 py-1.5 rounded-sm border ${
                          active
                            ? "border-[#C62828] bg-red-50 text-[#C62828] font-bold"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {encounterLabel(item)}
                        <span className="block text-[10px] font-medium text-gray-400">
                          {item.status || "Open"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>

        <PatientBanner patient={patient || undefined} />
        {sections.vitals && (
          <>
            <VitalTelemetry vitals={vitals} onChange={setVitals} />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!selectedId}
                onClick={() => void handleSaveVitals()}
                className="px-4 py-2 text-xs font-bold uppercase border border-gray-300 rounded-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Record vitals
              </button>
              {isBpCase && (
                <button
                  type="button"
                  onClick={() => void sendToDoctorQueue()}
                  className="px-4 py-2 text-xs font-bold uppercase bg-[#B71C1C] text-white rounded-sm hover:bg-[#991B1B]"
                >
                  BP done — join doctor queue
                </button>
              )}
              {isEmergency && (
                <span className="self-center text-[11px] font-bold uppercase text-[#C62828]">
                  Emergency — vitals only, no queue
                </span>
              )}
            </div>

            {vitalsHistory.length > 0 && (
              <div className="text-[11px] text-gray-500">
                History:{" "}
                {vitalsHistory
                  .slice(0, 5)
                  .map(
                    (row) =>
                      `${row.bloodPressureSystolic ?? "—"}/${row.bloodPressureDiastolic ?? "—"} @ ${
                        row.recordedAt ? new Date(row.recordedAt).toLocaleTimeString() : "—"
                      }`
                  )
                  .join(" · ")}
              </div>
            )}
          </>
        )}

        {sections.dressing && (
        <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
          <h3 className="text-sm font-bold">Dressing / injection</h3>
          {dressingOrders.length === 0 && (
            <p className="text-xs text-gray-400">No pending dressing or injection orders.</p>
          )}
          {dressingOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between text-xs border-b py-2">
              <div>
                <div className="font-bold">{order.patientName || order.id.slice(0, 8)}</div>
                <div className="text-gray-400">{order.instructions || order.status}</div>
              </div>
              <button
                type="button"
                onClick={() => void openDressing(order.id)}
                className="px-3 py-1 bg-[#2D3134] text-white rounded-sm uppercase text-[10px] font-bold"
              >
                Open
              </button>
            </div>
          ))}
          {selectedDressing && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold">
                Completing {selectedDressing.patientName || selectedDressing.id.slice(0, 8)}
              </p>
              <textarea
                value={procedureNotes}
                onChange={(e) => setProcedureNotes(e.target.value)}
                rows={3}
                placeholder="Procedure notes"
                className="w-full p-2.5 border border-gray-200 rounded-sm text-sm"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDressing(null)}
                  className="px-3 py-1 border rounded-sm text-[10px] font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void completeDressing()}
                  className="px-3 py-1 bg-[#B71C1C] text-white rounded-sm text-[10px] font-bold uppercase"
                >
                  Complete
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-500 font-mono pt-4 border-t border-gray-200 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock size={12} /> BP · emergency vitals · dressing
          </span>
          <button
            type="button"
            onClick={() => {
              void loadBoard();
              void loadDressing();
            }}
            className="flex items-center gap-1 hover:text-gray-800"
          >
            <RefreshCw size={12} /> Refresh board
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50/50 border border-amber-200/50 px-2 py-0.5 font-sans font-bold">
          <ShieldCheck size={12} />
          Doctors own consultation
        </div>
      </div>
    </div>
  );
}
