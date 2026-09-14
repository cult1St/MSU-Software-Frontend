"use client";

import React from "react";
import { Pill, Activity, Users } from "lucide-react";
import { PatientHeaderInfo, ReferralFlags } from "@src/types/consultation";

const fallbackPatient: PatientHeaderInfo = {
  id: "—",
  name: "SELECT AN ENCOUNTER",
  dob: "—",
  age: 0,
  gender: "Other",
  bloodType: "—",
  phone: "—",
  lastVisit: "—",
};

export default function PatientBanner({
  patient,
  referral,
  onReferralChange,
}: {
  patient?: PatientHeaderInfo;
  referral?: ReferralFlags;
  onReferralChange?: (next: ReferralFlags) => void;
}) {
  const data = patient ?? fallbackPatient;
  const flags: ReferralFlags = referral || {
    requiresDressing: false,
    dressingInstructions: "",
    isReferral: false,
    referralFacility: "",
    referralReason: "",
  };

  const toggleDressing = () => {
    onReferralChange?.({
      ...flags,
      requiresDressing: !flags.requiresDressing,
    });
  };

  const toggleReferral = () => {
    onReferralChange?.({
      ...flags,
      isReferral: !flags.isReferral,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <div className="lg:col-span-2 bg-white border border-gray-200 p-4 rounded-sm flex gap-4 items-center shadow-2xs">
        <div className="w-16 h-16 rounded-md border border-gray-300 bg-[#dcdce0] shrink-0" />
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 text-xs">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                {data.name}
              </h2>
              <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-sm font-mono text-[9px] font-bold">
                ID: {data.id}
              </span>
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wide mt-0.5">
              Primary Subject Profile
            </p>
          </div>
          <div className="col-span-2 text-right self-start hidden sm:block">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Last Visit
            </span>
            <span className="font-bold text-gray-800 text-xs">
              {data.lastVisit}
            </span>
          </div>

          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase">
              DOB / Age
            </span>
            <span className="font-bold text-gray-800">
              {data.dob} ({data.age}Y)
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase">
              Gender
            </span>
            <span className="font-bold text-gray-800">{data.gender}</span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] text-gray-400 font-bold uppercase">
              Phone
            </span>
            <span className="font-bold text-[#C62828] text-sm tracking-tight">
              {data.phone}
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 bg-[#2D3134] p-3 rounded-sm flex flex-col justify-between gap-2 shadow-2xs">
        <span className="text-[10px] font-black tracking-wider uppercase text-gray-400 px-1">
          Emergency & Referral
        </span>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() =>
              onReferralChange?.({
                ...flags,
                requiresDressing: true,
                dressingInstructions: flags.dressingInstructions || "Injection",
              })
            }
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold py-2 px-3 rounded-sm flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Pill size={14} /> Refer to Injection
            </span>
            <span>→</span>
          </button>
          <button
            type="button"
            onClick={toggleDressing}
            className={`w-full text-white text-xs font-bold py-2 px-3 rounded-sm flex items-center justify-between transition-colors ${
              flags.requiresDressing
                ? "bg-[#D32F2F] hover:bg-[#B71C1C]"
                : "bg-transparent border border-gray-600 hover:bg-gray-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Activity size={14} /> Refer to Dressing
            </span>
            <span>→</span>
          </button>
          {flags.requiresDressing && (
            <input
              value={flags.dressingInstructions}
              onChange={(e) =>
                onReferralChange?.({ ...flags, dressingInstructions: e.target.value })
              }
              placeholder="Dressing instructions"
              className="w-full text-[11px] px-2 py-1 rounded-sm bg-white/10 text-white placeholder:text-gray-500"
            />
          )}
          <button
            type="button"
            onClick={toggleReferral}
            className={`w-full text-white text-xs font-semibold py-2 px-3 rounded-sm flex items-center justify-between transition-colors ${
              flags.isReferral
                ? "bg-[#D32F2F]"
                : "bg-transparent border border-gray-600 hover:bg-gray-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <Users size={14} /> {flags.isReferral ? "Referral flagged" : "Specialist Referral"}
            </span>
            <span>→</span>
          </button>
          {flags.isReferral && (
            <div className="space-y-1">
              <input
                value={flags.referralFacility}
                onChange={(e) =>
                  onReferralChange?.({ ...flags, referralFacility: e.target.value })
                }
                placeholder="Referral facility"
                className="w-full text-[11px] px-2 py-1 rounded-sm bg-white/10 text-white placeholder:text-gray-500"
              />
              <input
                value={flags.referralReason}
                onChange={(e) =>
                  onReferralChange?.({ ...flags, referralReason: e.target.value })
                }
                placeholder="Referral reason"
                className="w-full text-[11px] px-2 py-1 rounded-sm bg-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          )}
          <div className="w-full bg-transparent border border-gray-600 text-gray-400 text-xs font-semibold py-2 px-3 rounded-sm flex items-center gap-2">
            <Pill size={14} /> Pharmacy follows consultation
          </div>
        </div>
      </div>
    </div>
  );
}
