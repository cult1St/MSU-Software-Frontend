"use client";

import React, { ChangeEvent } from "react";
import { Plus, Trash2, FileEdit, ClipboardList, Beaker } from "lucide-react";
import {
  SoapNotes,
  MedicationPrescription,
  DiagnosticOrders,
} from "@src/types/consultation";
import type { DrugRoute } from "@src/dto/common";

interface WorkspaceProps {
  soapNotes: SoapNotes;
  onSoapNotesChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  prescriptions: MedicationPrescription[];
  onAddPrescription: () => void;
  onRemovePrescription: (id: string) => void;
  onPrescriptionChange: (id: string, patch: Partial<MedicationPrescription>) => void;
  diagnostics: DiagnosticOrders;
  onDiagnosticToggle: (field: keyof Omit<DiagnosticOrders, "additionalInstructions">) => void;
  onInstructionsChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const ROUTES: DrugRoute[] = ["Oral", "IV", "IM", "Topical"];

const LAB_ORDERS = [
  { key: "cbc", label: "Complete Blood Count (CBC)" },
  { key: "lipidProfile", label: "Lipid Profile" },
  { key: "ecg12Lead", label: "12-Lead ECG" },
  { key: "kft", label: "Kidney Function Test (KFT)" },
] as const;

export default function ConsultationWorkspace({
  soapNotes,
  onSoapNotesChange,
  prescriptions,
  onAddPrescription,
  onRemovePrescription,
  onPrescriptionChange,
  diagnostics,
  onDiagnosticToggle,
  onInstructionsChange,
}: WorkspaceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="bg-white border border-gray-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="bg-[#2D3134] text-white p-3 px-4 flex items-center gap-2 text-xs font-bold tracking-wide">
          <FileEdit size={14} />
          <span>SOAP Clinical Notes</span>
        </div>
        <div className="p-4 space-y-4 text-xs">
          {(["subjective", "objective", "assessment", "plan"] as const).map((field) => (
            <div key={field} className="space-y-1">
              <label className="block text-[10px] font-black text-[#C62828] uppercase tracking-wide">
                {field}
              </label>
              <textarea
                name={field}
                value={soapNotes[field]}
                onChange={onSoapNotesChange}
                rows={3}
                className="w-full p-2.5 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400 text-gray-700 leading-relaxed font-medium resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-sm shadow-2xs overflow-hidden">
          <div className="bg-gray-100 p-3 px-4 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <ClipboardList size={14} /> Digital Prescription
            </span>
            <button
              type="button"
              onClick={onAddPrescription}
              className="bg-[#2B2B2B] hover:bg-black text-white font-extrabold text-[9px] px-2 py-1 rounded-xs tracking-wider uppercase flex items-center gap-1 transition-colors"
            >
              <Plus size={10} /> Add Drug
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[520px]">
              <thead>
                <tr className="bg-[#1A1C1E] text-gray-400 font-bold text-[9px] uppercase tracking-wider">
                  <th className="p-2.5 pl-4">Medication</th>
                  <th className="p-2.5">Dosage</th>
                  <th className="p-2.5">Freq</th>
                  <th className="p-2.5">Days</th>
                  <th className="p-2.5">Route</th>
                  <th className="p-2.5 pr-4 text-center"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescriptions.map((drug) => (
                  <tr key={drug.id} className="hover:bg-gray-50/50">
                    <td className="p-2 pl-4">
                      <input
                        value={drug.name}
                        onChange={(e) => onPrescriptionChange(drug.id, { name: e.target.value })}
                        className="w-full font-bold text-gray-800 bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={drug.dosage}
                        onChange={(e) => onPrescriptionChange(drug.id, { dosage: e.target.value })}
                        className="w-20 bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={drug.frequency}
                        onChange={(e) => onPrescriptionChange(drug.id, { frequency: e.target.value })}
                        className="w-20 bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={drug.durationDays}
                        onChange={(e) =>
                          onPrescriptionChange(drug.id, {
                            durationDays: Number(e.target.value) || 0,
                          })
                        }
                        className="w-12 bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={drug.route}
                        onChange={(e) =>
                          onPrescriptionChange(drug.id, { route: e.target.value as DrugRoute })
                        }
                        className="bg-transparent outline-none"
                      >
                        {ROUTES.map((route) => (
                          <option key={route} value={route}>
                            {route}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 pr-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemovePrescription(drug.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded inline-flex"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-2xs overflow-hidden">
          <div className="bg-gray-100 p-3 px-4 border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Beaker size={14} /> Lab & Diagnostic Orders
          </div>
          <div className="p-4 space-y-4 text-xs">
            <p className="text-[11px] font-medium text-gray-500">
              Fixed order list on this screen. Checked tests are saved with Finalize Consultation and appear for the scientist. They are not loaded from a lab catalog.
            </p>
            <div className="grid grid-cols-2 gap-3 font-semibold text-gray-800">
              {LAB_ORDERS.map((test) => {
                const checked = diagnostics[test.key];
                return (
                  <label
                    key={test.key}
                    className={`flex items-center gap-2.5 p-2 border rounded-sm cursor-pointer ${
                      checked
                        ? "bg-[#C62828] text-white border-transparent"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onDiagnosticToggle(test.key)}
                      className={`w-3.5 h-3.5 ${checked ? "accent-white" : "accent-[#C62828]"}`}
                    />
                    <span>{test.label}</span>
                  </label>
                );
              })}
            </div>
            <textarea
              value={diagnostics.additionalInstructions}
              onChange={onInstructionsChange}
              rows={3}
              placeholder="Clinical indication / additional instructions"
              className="w-full p-2.5 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400 text-sm placeholder-gray-400 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
