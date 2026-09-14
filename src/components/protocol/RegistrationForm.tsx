"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Search, UserCheck } from "lucide-react";
import { toast } from "react-toastify";
import { RegistrationFormData, CaseType } from "@src/types/protocol";
import type { Patient } from "@src/dto/patient";
import patientsService from "@src/services/patients.service";
import encountersService from "@src/services/encounters.service";
import operationsService from "@src/services/operations.service";
import { getApiErrorMessage } from "@src/utils/api-error";
import { getStaffId, isUuid } from "@src/utils/staff";

const initialFormState: RegistrationFormData = {
  fullName: "",
  age: "",
  sex: "F",
  phone: "",
  address: "",
  identificationId: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
  nextOfKinRelationship: "",
  chiefComplaint: "",
  arrivalMode: "WalkedIn",
  caseType: "STANDARD",
};

export default function RegistrationForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Patient[]>([]);
  const [existingPatient, setExistingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "emergency") {
      setFormData((prev) => ({
        ...prev,
        caseType: "EMERGENCY",
        arrivalMode: prev.arrivalMode === "WalkedIn" ? "Supported" : prev.arrivalMode,
      }));
    }
  }, [searchParams]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "fullName" || name === "phone") {
      setExistingPatient(null);
    }
  };

  const handleCaseTypeChange = (type: CaseType) => {
    setFormData((prev) => ({
      ...prev,
      caseType: type,
      arrivalMode:
        type === "EMERGENCY"
          ? prev.arrivalMode === "WalkedIn"
            ? "Supported"
            : prev.arrivalMode
          : "WalkedIn",
    }));
  };

  const applyPatient = (patient: Patient) => {
    setExistingPatient(patient);
    setFormData((prev) => ({
      ...prev,
      fullName: patient.fullName || prev.fullName,
      age: patient.age != null ? String(patient.age) : prev.age,
      sex: patient.sex || prev.sex,
      phone: patient.phone || prev.phone,
      address: patient.address || prev.address,
      nextOfKinName: patient.nextOfKinName || prev.nextOfKinName,
      nextOfKinPhone: patient.nextOfKinPhone || prev.nextOfKinPhone,
      nextOfKinRelationship:
        patient.nextOfKinRelationship || prev.nextOfKinRelationship,
    }));
    setMatches([]);
  };

  const handleSearch = async () => {
    if (!formData.fullName && !formData.phone) {
      toast.error("Enter a name or phone number to search");
      return;
    }
    setIsSearching(true);
    try {
      const results = await patientsService.search({
        name: formData.fullName || undefined,
        phone: formData.phone || undefined,
      });
      setMatches(results || []);
      if (!results?.length) {
        toast.info("No matching patient. Register as new.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to search patients"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    if (!formData.fullName || !formData.phone) {
      setSubmitError("Full name and phone are required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.nextOfKinName || !formData.nextOfKinPhone || !formData.nextOfKinRelationship) {
      setSubmitError("Next of kin name, phone, and relationship are required.");
      setIsSubmitting(false);
      return;
    }

    const registrarId = getStaffId("registrar");
    if (!isUuid(registrarId)) {
      const message =
        "Cannot admit this patient — no duty registrar is configured. Ask an administrator to open today’s consult hours first.";
      setSubmitError(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    try {
      let patientId = existingPatient?.id;
      if (!patientId) {
        const patient = await patientsService.register({
          fullName: formData.fullName,
          age: Number(formData.age) || 0,
          sex: formData.sex,
          phone: formData.phone,
          address: formData.address,
          nextOfKinName: formData.nextOfKinName,
          nextOfKinPhone: formData.nextOfKinPhone,
          nextOfKinRelationship: formData.nextOfKinRelationship,
        });
        if (!patient?.id) {
          throw new Error("Patient could not be registered.");
        }
        patientId = patient.id;
      }

      try {
        const isEmergency = formData.caseType === "EMERGENCY";
        const age = Number(formData.age) || 0;
        const encounter = await encountersService.open({
          patientId,
          admissionType: isEmergency ? "Emergency" : "ColdCase",
          arrivalMode: isEmergency
            ? formData.arrivalMode === "WalkedIn"
              ? "Supported"
              : formData.arrivalMode
            : "WalkedIn",
          chiefComplaint: formData.chiefComplaint,
          registeredBy: registrarId,
        });

        if (!encounter?.id) {
          toast.error(
            existingPatient
              ? "Could not open an encounter for this patient."
              : "Patient was registered, but the encounter could not be opened."
          );
          return;
        }

        if (isEmergency) {
          await encountersService.updateStatus(encounter.id, {
            status: "Admitted",
          });
          toast.success("Emergency admitted to the ward. Doctor can see them now.");
        } else if (age > 40) {
          await encountersService.updateStatus(encounter.id, {
            status: "BpCheck",
          });
          toast.success("Cold case registered. Send to nurses for BP check before the doctor queue.");
        } else {
          await encountersService.updateStatus(encounter.id, {
            status: "Queued",
          });
          await operationsService.joinQueue(encounter.id);
          toast.success("Cold case registered and added to the doctor queue.");
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to open encounter"));
        return;
      }

      setFormData({
        ...initialFormState,
        caseType: formData.caseType,
        arrivalMode: formData.caseType === "EMERGENCY" ? "Supported" : "WalkedIn",
      });
      setExistingPatient(null);
      setMatches([]);
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to register patient");
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmergency = formData.caseType === "EMERGENCY";

  return (
    <div className="bg-white border border-gray-200 p-5 shadow-sm rounded-sm">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-[#C62828]" />
          <h2 className="text-base font-bold text-gray-800">
            {isEmergency ? "Patient Emergency Registration" : "Patient Cold Case Registration"}
          </h2>
        </div>

        <div className="bg-gray-100 p-0.5 rounded flex border border-gray-200 text-[10px] font-bold tracking-wider">
          <button
            type="button"
            onClick={() => handleCaseTypeChange("STANDARD")}
            className={`px-3 py-1 rounded-sm transition-all ${
              formData.caseType === "STANDARD"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400"
            }`}
          >
            STANDARD
          </button>
          <button
            type="button"
            onClick={() => handleCaseTypeChange("EMERGENCY")}
            className={`px-3 py-1 rounded-sm transition-all ${
              formData.caseType === "EMERGENCY"
                ? "bg-[#C62828] text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            EMERGENCY
          </button>
        </div>
      </div>

      {existingPatient && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-800">
          Using existing patient {existingPatient.fullName}
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs font-semibold text-[#C62828]">
          {submitError}
        </div>
      )}

      <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Legal Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="e.g. Johnathan Doe"
          />
          <Field
            label="Date of Birth / Age"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="DD/MM/YYYY or Years"
          />
          <Field
            label="Contact Number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="+234 …"
          />
          <Field
            label="Identification ID"
            name="identificationId"
            value={formData.identificationId || ""}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="Optional local ID"
          />
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Sex
            </label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full p-2.5 border border-gray-300 rounded-sm text-sm"
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
          </div>
          {isEmergency ? (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Arrival Mode
              </label>
              <select
                name="arrivalMode"
                value={formData.arrivalMode}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full p-2.5 border border-gray-300 rounded-sm text-sm"
              >
                <option value="Supported">Supported</option>
                <option value="Stretcher">Stretcher</option>
              </select>
            </div>
          ) : (
            <Field
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Residential address"
            />
          )}
        </div>

        <div className="border border-gray-100 rounded-sm p-3 bg-gray-50/60 space-y-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Next of kin (required)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field
              label="Name"
              name="nextOfKinName"
              value={formData.nextOfKinName}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
            <Field
              label="Phone"
              name="nextOfKinPhone"
              value={formData.nextOfKinPhone}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
            <Field
              label="Relationship"
              name="nextOfKinRelationship"
              value={formData.nextOfKinRelationship}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>
          {isEmergency && (
            <Field
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          )}
        </div>

        {matches.length > 0 && (
          <div className="border border-gray-200 rounded-sm divide-y">
            {matches.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => applyPatient(patient)}
                className="w-full text-left p-2.5 hover:bg-gray-50 text-xs"
              >
                <span className="font-bold text-gray-800">
                  {patient.fullName || "Unnamed"}
                </span>
                <span className="text-gray-400 ml-2">
                  {patient.phone || "no phone"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Main Complaint / Symptoms
          </label>
          <textarea
            rows={4}
            name="chiefComplaint"
            value={formData.chiefComplaint}
            onChange={handleInputChange}
            placeholder="Describe the primary reason for visit..."
            className="w-full p-2.5 border border-gray-300 rounded-sm focus:outline-none focus:border-gray-500 text-sm resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isSubmitting || isSearching}
            className="px-4 py-3 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 font-bold uppercase text-xs disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Search size={14} />
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 min-w-[200px] bg-[#B71C1C] hover:bg-[#991B1B] text-white font-bold py-3 px-4 rounded-sm transition-colors flex items-center justify-center gap-2 tracking-wide uppercase text-xs disabled:bg-gray-400"
          >
            <UserCheck size={16} />
            {isSubmitting ? "Processing..." : "Complete Registration"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData(initialFormState);
              setSubmitError(null);
              setExistingPatient(null);
              setMatches([]);
            }}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-sm text-gray-600 hover:bg-gray-50 font-bold uppercase text-xs disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full p-2.5 border border-gray-300 rounded-sm focus:outline-none focus:border-gray-500 text-sm"
      />
    </div>
  );
}
