"use client";

import React from "react";
import { FlaskConical, TrendingUp, TrendingDown } from "lucide-react";
import { LabRequestItem, LabResultDraft } from "@src/types/pharmacy";

interface LabRequestsProps {
  requests: LabRequestItem[];
  selectedId: string;
  draft: LabResultDraft;
  completedCount: number;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onDraftChange: (patch: Partial<LabResultDraft>) => void;
  onSubmitResult: (id: string) => Promise<void>;
}

export default function LabRequestsPanel({
  requests,
  selectedId,
  draft,
  completedCount,
  onSelect,
  onStart,
  onDraftChange,
  onSubmitResult,
}: LabRequestsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <FlaskConical size={14} />
            <span>Lab Requests</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {requests.length === 0 && (
            <p className="text-xs text-gray-400">No lab requests.</p>
          )}
          {requests.map((lab) => (
            <div key={lab.id} className="border border-gray-100 rounded-sm p-3 bg-white space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 tracking-tight">{lab.testName}</h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">Patient: {lab.patientName}</p>
                </div>
                <span
                  className={`text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-xs border ${
                    lab.status === "PROCESSING"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : lab.status === "PENDING"
                        ? "bg-gray-50 text-gray-500 border-gray-200"
                        : "bg-green-50 text-green-700 border-green-200"
                  }`}
                >
                  • {lab.status}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] font-mono text-gray-400 font-bold">ID: {lab.id.slice(0, 8)}</span>
                {lab.status === "PROCESSING" && (
                  <button
                    type="button"
                    onClick={() => onSelect(lab.id)}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-[10px] px-2.5 py-1 rounded-xs tracking-wide"
                  >
                    Enter Results
                  </button>
                )}
                {lab.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => onStart(lab.id)}
                    className="bg-[#2D3134] hover:bg-black text-white font-bold text-[10px] px-3 py-1 rounded-xs tracking-wide uppercase"
                  >
                    Start Analysis
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedId && (
          <div className="border-t p-4 space-y-2 text-xs">
            <input
              value={draft.parameter}
              onChange={(e) => onDraftChange({ parameter: e.target.value })}
              placeholder="Parameter"
              className="w-full border p-2 rounded-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <input value={draft.value} onChange={(e) => onDraftChange({ value: e.target.value })} placeholder="Value" className="border p-2 rounded-sm" />
              <input value={draft.unit} onChange={(e) => onDraftChange({ unit: e.target.value })} placeholder="Unit" className="border p-2 rounded-sm" />
              <input value={draft.referenceRange} onChange={(e) => onDraftChange({ referenceRange: e.target.value })} placeholder="Ref range" className="border p-2 rounded-sm" />
            </div>
            <textarea
              value={draft.findings}
              onChange={(e) => onDraftChange({ findings: e.target.value })}
              placeholder="Findings"
              rows={2}
              className="w-full border p-2 rounded-sm"
            />
            <textarea
              value={draft.conclusion}
              onChange={(e) => onDraftChange({ conclusion: e.target.value })}
              placeholder="Conclusion"
              rows={2}
              className="w-full border p-2 rounded-sm"
            />
            <button
              type="button"
              onClick={() => void onSubmitResult(selectedId)}
              className="w-full bg-[#B71C1C] text-white py-2 rounded-sm text-[10px] font-bold uppercase"
            >
              Post lab result
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#1A1C1E] text-white p-5 rounded-sm shadow-2xs space-y-5">
        <span className="text-[10px] font-black tracking-wider uppercase text-gray-500 block">
          Daily Summary
        </span>
        <div>
          <div className="flex justify-between items-baseline">
            <span className="text-4xl font-black font-sans tracking-tight">
              {String(completedCount).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold text-green-400 font-mono flex items-center gap-0.5">
              <TrendingUp size={12} /> done
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">
            Lab tests completed
          </p>
        </div>
        <div className="border-t border-gray-800 pt-4">
          <div className="flex justify-between items-baseline">
            <span className="text-4xl font-black font-sans tracking-tight">
              {String(requests.length).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold text-red-400 font-mono flex items-center gap-0.5">
              <TrendingDown size={12} /> open
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">
            Open lab requests
          </p>
        </div>
      </div>
    </div>
  );
}
