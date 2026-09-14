"use client";

import { useCallback, useEffect, useState, ChangeEvent, FormEvent } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "react-toastify";
import type { AdmissionType, EncounterStatus } from "@src/dto/common";
import type { ContactTraceDTO, Encounter } from "@src/dto/encounter";
import encountersService from "@src/services/encounters.service";
import { getApiErrorMessage } from "@src/utils/api-error";
import { requireStaffId } from "@src/utils/staff";

const STATUS_OPTIONS: EncounterStatus[] = [
  "Registered",
  "Queued",
  "BpCheck",
  "InConsultation",
  "PharmacyPending",
  "LabPending",
  "DressingPending",
  "AwaitingHandover",
  "Discharged",
  "Referred",
];

const emptyTrace: Omit<ContactTraceDTO, "recordedBy"> = {
  nextOfKinName: "",
  nextOfKinPhone: "",
  nextOfKinRelationship: "",
  residentialAddress: "",
  workplaceAddress: "",
  dischargeNotes: "",
  referralDestination: "",
};

export default function RecentRecords() {
  const [records, setRecords] = useState<Encounter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<EncounterStatus | "">("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<AdmissionType | "">("");
  const [selected, setSelected] = useState<Encounter | null>(null);
  const [traceForm, setTraceForm] = useState(emptyTrace);
  const [hasTrace, setHasTrace] = useState(false);
  const [savingTrace, setSavingTrace] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await encountersService.list({
        status: status || undefined,
        date: date || undefined,
        type: type || undefined,
      });
      setRecords((data || []).slice(0, 20));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load encounters"));
    } finally {
      setIsLoading(false);
    }
  }, [status, date, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEncounter = async (encounter: Encounter) => {
    try {
      const chart = await encountersService.getChart(encounter.id);
      setSelected(chart.encounter);
      const existing =
        chart.contactTrace ||
        (await encountersService.getContactTrace(encounter.id).catch(() => null));
      setHasTrace(
        Boolean(
          existing?.id || existing?.nextOfKinName || existing?.residentialAddress
        )
      );
      setTraceForm({
        nextOfKinName: existing?.nextOfKinName || "",
        nextOfKinPhone: existing?.nextOfKinPhone || "",
        nextOfKinRelationship: existing?.nextOfKinRelationship || "",
        residentialAddress: existing?.residentialAddress || "",
        workplaceAddress: existing?.workplaceAddress || "",
        dischargeNotes: existing?.dischargeNotes || "",
        referralDestination: existing?.referralDestination || "",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load encounter"));
    }
  };

  const handleTraceChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTraceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveTrace = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSavingTrace(true);
    try {
      const payload: ContactTraceDTO = {
        recordedBy: requireStaffId("registrar", "recordedBy"),
        nextOfKinName: traceForm.nextOfKinName || null,
        nextOfKinPhone: traceForm.nextOfKinPhone || null,
        nextOfKinRelationship: traceForm.nextOfKinRelationship || null,
        residentialAddress: traceForm.residentialAddress || null,
        workplaceAddress: traceForm.workplaceAddress || null,
        dischargeNotes: traceForm.dischargeNotes || "—",
        referralDestination: traceForm.referralDestination || null,
      };
      await (hasTrace
        ? encountersService.updateContactTrace(selected.id, payload)
        : encountersService.createContactTrace(selected.id, payload));
      setHasTrace(true);
      toast.success(hasTrace ? "Contact trace updated" : "Contact trace recorded");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save contact trace"));
    } finally {
      setSavingTrace(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-[#2D3134] text-white p-3.5 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FileSpreadsheet size={16} />
            <span>Recent Patient Records</span>
          </div>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EncounterStatus | "")}
              className="bg-[#1A1C1E] text-[10px] px-2 py-1 rounded-sm"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AdmissionType | "")}
              className="bg-[#1A1C1E] text-[10px] px-2 py-1 rounded-sm"
            >
              <option value="">All types</option>
              <option value="Emergency">Emergency</option>
              <option value="ColdCase">Cold case</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#1A1C1E] text-[10px] px-2 py-1 rounded-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1A1C1E] text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="p-3 pl-4">Patient ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Last Visit</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-400">
                    Loading encounters...
                  </td>
                </tr>
              )}
              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-400">
                    No encounters found.
                  </td>
                </tr>
              )}
              {records.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60">
                  <td className="p-3 pl-4 font-mono text-gray-500 font-semibold">
                    #{item.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="p-3 font-bold text-gray-800">
                    {item.patientName || item.fullName || item.patientId || "—"}
                  </td>
                  <td className="p-3 text-gray-600">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[9px] font-extrabold tracking-wide border ${
                        String(item.status || "").toLowerCase().includes("discharge")
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <button
                      type="button"
                      onClick={() => void openEncounter(item)}
                      className="text-gray-400 hover:text-gray-700 p-1 inline-flex"
                    >
                      <FileText size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <form
          onSubmit={handleSaveTrace}
          className="bg-white border border-gray-200 rounded-sm shadow-sm p-4 space-y-3"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">
              Contact trace · {selected.patientName || selected.id.slice(0, 8)}
            </h3>
            <span className="text-[10px] text-gray-400 uppercase font-bold">
              {selected.status} · {selected.admissionType || "—"}
            </span>
          </div>
          <p className="text-xs text-gray-500">{selected.chiefComplaint || "No complaint recorded"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <TraceField name="nextOfKinName" label="Next of kin" value={traceForm.nextOfKinName || ""} onChange={handleTraceChange} />
            <TraceField name="nextOfKinPhone" label="NOK phone" value={traceForm.nextOfKinPhone || ""} onChange={handleTraceChange} />
            <TraceField name="nextOfKinRelationship" label="Relationship" value={traceForm.nextOfKinRelationship || ""} onChange={handleTraceChange} />
            <TraceField name="referralDestination" label="Referral destination" value={traceForm.referralDestination || ""} onChange={handleTraceChange} />
            <TraceField name="residentialAddress" label="Residential address" value={traceForm.residentialAddress || ""} onChange={handleTraceChange} />
            <TraceField name="workplaceAddress" label="Workplace address" value={traceForm.workplaceAddress || ""} onChange={handleTraceChange} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Discharge notes</label>
            <textarea
              name="dischargeNotes"
              value={traceForm.dischargeNotes || ""}
              onChange={handleTraceChange}
              rows={3}
              className="w-full p-2.5 border border-gray-300 rounded-sm text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="px-4 py-2 border border-gray-300 rounded-sm text-xs font-bold uppercase"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={savingTrace}
              className="px-4 py-2 bg-[#B71C1C] text-white rounded-sm text-xs font-bold uppercase disabled:opacity-50"
            >
              {savingTrace ? "Saving..." : hasTrace ? "Update trace" : "Record trace"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TraceField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-gray-400 uppercase">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2.5 border border-gray-300 rounded-sm text-sm"
      />
    </div>
  );
}
