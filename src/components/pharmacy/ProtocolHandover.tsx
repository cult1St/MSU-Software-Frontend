"use client";

import React from "react";
import { Layers, Send } from "lucide-react";
import { HandoverBatch } from "@src/types/pharmacy";

interface ProtocolHandoverProps {
  batches: HandoverBatch[];
  onToggle: (id: string, field: keyof HandoverBatch) => void;
  onNotesChange: (id: string, notes: string) => void;
  onSubmitHandover: () => Promise<void>;
  isSubmitting: boolean;
}

export default function ProtocolHandover({
  batches,
  onToggle,
  onNotesChange,
  onSubmitHandover,
  isSubmitting,
}: ProtocolHandoverProps) {
  const ready = batches.filter(
    (b) =>
      b.patientNameVerified &&
      b.drugListVerified &&
      b.dosageCounsellingDone &&
      b.durationCounsellingDone
  );
  const canSubmit = ready.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-2xs p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
          <Layers size={14} />
          <span>Ready for Protocol Handover</span>
        </div>
        <span className="bg-gray-800 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-sm">
          {batches.length} SECURED BATCHES
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batches.map((batch) => (
          <div key={batch.id} className="border border-gray-200 rounded-sm p-4 bg-white space-y-3">
            <div className="flex justify-between items-start text-[10px]">
              <span className="bg-gray-100 border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded-sm font-mono font-bold">
                {batch.id.slice(0, 8)}
              </span>
              <span className="font-mono text-gray-400 font-bold">{batch.timestamp}</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">
                {batch.patientName} ({batch.patientId})
              </h4>
              <p className="text-[11px] text-gray-500 font-medium mt-1">{batch.itemsDescription}</p>
            </div>
            {(
              [
                ["patientNameVerified", "Patient name verified"],
                ["drugListVerified", "Drug list verified"],
                ["dosageCounsellingDone", "Dosage counselling done"],
                ["durationCounsellingDone", "Duration counselling done"],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={Boolean(batch[field])}
                  onChange={() => onToggle(batch.id, field)}
                  disabled={isSubmitting}
                  className="accent-[#B71C1C] w-3.5 h-3.5"
                />
                {label}
              </label>
            ))}
            <textarea
              value={batch.counsellingNotes}
              onChange={(e) => onNotesChange(batch.id, e.target.value)}
              placeholder="Counselling notes"
              rows={2}
              className="w-full border border-gray-200 rounded-sm p-2 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-stretch pt-2">
        <button
          type="button"
          onClick={onSubmitHandover}
          disabled={isSubmitting || !canSubmit}
          className="w-full bg-[#2D3134] hover:bg-black text-white font-bold text-xs uppercase px-6 py-3 rounded-sm flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed tracking-wide"
        >
          <span>
            {isSubmitting
              ? "Submitting..."
              : "Submit to Protocol Team"}
          </span>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
