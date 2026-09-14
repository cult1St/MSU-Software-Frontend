"use client";

import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { PageHeader } from "@src/components/ui/page-header";
import { Button } from "@src/components/ui/button";
import { Badge } from "@src/components/ui/badge";
import PatientBanner from "@src/components/consultation/PatientBanner";
import ConsultationWorkspace from "@src/components/consultation/ConsultationWorkspace";
import VitalTelemetry from "@src/components/consultation/VitalTelemetry";
import type { Encounter, EncounterVitals, LabTestPlanDTO } from "@src/dto/encounter";
import type { LabResult } from "@src/dto/lab";
import type { ServiceWindow } from "@src/dto/operations";
import type {
  DiagnosticOrders,
  MedicationPrescription,
  PatientHeaderInfo,
  ReferralFlags,
  SoapNotes,
  VitalMetrics,
} from "@src/types/consultation";
import encountersService from "@src/services/encounters.service";
import labService from "@src/services/lab.service";
import operationsService from "@src/services/operations.service";
import { getApiErrorMessage } from "@src/utils/api-error";
import { requireStaffId } from "@src/utils/staff";
import { isServiceWindowOpen } from "@src/utils/service-window";

const initialSoap: SoapNotes = {
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
};

const emptyReferral: ReferralFlags = {
  requiresDressing: false,
  dressingInstructions: "",
  isReferral: false,
  referralFacility: "",
  referralReason: "",
};

function isEmergencyEncounter(item: Encounter) {
  return String(item.admissionType || "").toLowerCase().includes("emergency");
}

function mergeEncounters(lists: Encounter[][]) {
  const map = new Map<string, Encounter>();
  lists.flat().forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

function vitalsToMetrics(v: EncounterVitals | null): VitalMetrics {
  return {
    bloodPressureSystolic: v?.bloodPressureSystolic ?? "",
    bloodPressureDiastolic: v?.bloodPressureDiastolic ?? "",
    pulseRate: v?.pulseRate ?? "",
    temperatureCelsius: v?.temperature ?? "",
    weightKg: v?.weight ?? "",
    spo2: v?.spo2 ?? "",
    respiratoryRate: v?.respiratoryRate ?? "",
    notes: v?.notes || "",
  };
}

export default function DoctorsPage() {
  const [emergencyBoard, setEmergencyBoard] = useState<Encounter[]>([]);
  const [coldBoard, setColdBoard] = useState<Encounter[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [patientHeader, setPatientHeader] = useState<PatientHeaderInfo | null>(null);
  const [vitals, setVitals] = useState<EncounterVitals | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [windowInfo, setWindowInfo] = useState<ServiceWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soapNotes, setSoapNotes] = useState<SoapNotes>(initialSoap);
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticOrders>({
    cbc: false,
    lipidProfile: false,
    ecg12Lead: false,
    kft: false,
    additionalInstructions: "",
  });
  const [referral, setReferral] = useState<ReferralFlags>(emptyReferral);

  const windowOpen = isServiceWindowOpen(windowInfo);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [emergencies, admitted, inTreatment, queued, inConsult, currentWindow] =
        await Promise.all([
          encountersService.list({ type: "Emergency" }).catch(() => []),
          encountersService.listByStatus("Admitted").catch(() => []),
          encountersService.listByStatus("InTreatment").catch(() => []),
          encountersService.listByStatus("Queued").catch(() => []),
          encountersService.listByStatus("InConsultation").catch(() => []),
          operationsService.getServiceWindow().catch(() => null),
        ]);
      setWindowInfo(currentWindow);
      setEmergencyBoard(
        mergeEncounters([emergencies || [], admitted || [], inTreatment || []]).filter(
          isEmergencyEncounter
        )
      );
      setColdBoard(
        mergeEncounters([queued || [], inConsult || []]).filter(
          (item) => !isEmergencyEncounter(item)
        )
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load doctor board"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEncounter = async (encounterId: string) => {
    setSelectedId(encounterId);
    try {
      const chart = await encountersService.getChart(encounterId);
      const detail = chart.encounter;
      const person = chart.patient;
      const consultation =
        chart.consultation ||
        (await encountersService.getConsultation(encounterId).catch(() => null));
      const latestVitals =
        (chart.vitals && chart.vitals[chart.vitals.length - 1]) ||
        (await encountersService.getLatestVitals(encounterId).catch(() => null));
      const results =
        (chart.labResults as LabResult[] | undefined) ||
        (await labService.getEncounterLabResults(encounterId).catch(() => [])) ||
        [];

      setVitals(latestVitals || null);
      setLabResults(results);
      setPatientHeader({
        id: detail.patientId || encounterId.slice(0, 8),
        name: person?.fullName || detail.patientName || detail.fullName || "Patient",
        dob: "—",
        age: person?.age || 0,
        gender:
          person?.sex === "M" ? "Male" : person?.sex === "F" ? "Female" : "Other",
        bloodType: "—",
        phone: person?.phone || "—",
        lastVisit: detail.createdAt
          ? new Date(detail.createdAt).toLocaleDateString()
          : "—",
      });
      setSoapNotes({
        subjective: consultation?.clinicalNotes || detail?.chiefComplaint || "",
        objective: "",
        assessment: (consultation?.diagnosis || []).join(", "),
        plan: "",
      });
      setPrescriptions(
        (consultation?.treatmentPlan?.prescriptions || []).map((rx, idx) => ({
          id: `rx-${idx}`,
          name: rx.drugName || "",
          dosage: rx.dosage || "",
          frequency: rx.frequency || "",
          durationDays: Number(String(rx.duration || "").replace(/\D/g, "")) || 3,
          route: rx.route || "Oral",
          instructions: rx.instructions || "",
        }))
      );
      if (!(consultation?.treatmentPlan?.prescriptions || []).length) {
        setPrescriptions([]);
      }
      setReferral({
        requiresDressing: Boolean(consultation?.treatmentPlan?.requiresDressing),
        dressingInstructions: consultation?.treatmentPlan?.dressingInstructions || "",
        isReferral: Boolean(consultation?.treatmentPlan?.isReferral),
        referralFacility: consultation?.treatmentPlan?.referralFacility || "",
        referralReason: consultation?.treatmentPlan?.referralReason || "",
      });
      setDiagnostics({
        cbc: false,
        lipidProfile: false,
        ecg12Lead: false,
        kft: false,
        additionalInstructions: "",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load encounter"));
    }
  };

  const selected =
    emergencyBoard.find((row) => row.id === selectedId) ||
    coldBoard.find((row) => row.id === selectedId);
  const selectedIsEmergency = selected ? isEmergencyEncounter(selected) : false;
  const canConsult = Boolean(selectedId) && (selectedIsEmergency || windowOpen);

  const handleFinalize = async () => {
    if (!selectedId) {
      toast.error("Select a patient first");
      return;
    }
    if (!canConsult) {
      toast.error("Cold-case consultation window is closed.");
      return;
    }
    setIsSubmitting(true);
    try {
      const labTests: LabTestPlanDTO[] = [];
      if (diagnostics.cbc) {
        labTests.push({
          testName: "Full Blood Count",
          clinicalIndication: diagnostics.additionalInstructions || "CBC requested",
        });
      }
      if (diagnostics.lipidProfile) {
        labTests.push({
          testName: "Lipid Profile",
          clinicalIndication: diagnostics.additionalInstructions || "Lipid profile requested",
        });
      }
      if (diagnostics.ecg12Lead) {
        labTests.push({
          testName: "ECG 12-Lead",
          clinicalIndication: diagnostics.additionalInstructions || "ECG requested",
        });
      }
      if (diagnostics.kft) {
        labTests.push({
          testName: "Kidney Function Test",
          clinicalIndication: diagnostics.additionalInstructions || "KFT requested",
        });
      }

      const namedRx = prescriptions.filter((rx) => rx.name);
      await encountersService.createConsultation(selectedId, {
        doctorId: requireStaffId("doctor", "doctorId"),
        diagnosis: [soapNotes.assessment || "Clinical review"].filter(Boolean),
        clinicalNotes: [soapNotes.subjective, soapNotes.objective, soapNotes.plan]
          .filter(Boolean)
          .join("\n\n"),
        treatmentPlan: {
          prescriptions: namedRx.map((rx) => ({
            drugName: rx.name,
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: `${rx.durationDays} days`,
            route: rx.route,
            instructions: rx.instructions || null,
          })),
          labTests,
          requiresDressing: referral.requiresDressing,
          dressingInstructions: referral.dressingInstructions || null,
          isReferral: referral.isReferral,
          referralFacility: referral.referralFacility || null,
          referralReason: referral.referralReason || null,
        },
      });

      try {
        if (referral.isReferral) {
          await encountersService.updateStatus(selectedId, { status: "Referred" });
        } else if (namedRx.length) {
          await encountersService.updateStatus(selectedId, { status: "PharmacyPending" });
        } else if (labTests.length) {
          await encountersService.updateStatus(selectedId, { status: "LabPending" });
        } else if (referral.requiresDressing) {
          await encountersService.updateStatus(selectedId, { status: "DressingPending" });
        }
      } catch (statusError) {
        toast.warn(
          getApiErrorMessage(
            statusError,
            "Consultation saved, but the next-step status could not be updated"
          )
        );
      }

      toast.success("Consultation finalized. Pharmacy is next if drugs were ordered.");
      setSelectedId("");
      setPatientHeader(null);
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save consultation"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader
        title="Doctors Station"
        description="Emergencies any time. Cold cases only while the consult window is open."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-sm p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Emergency ward
            </h3>
            <Badge variant="live">{emergencyBoard.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLoading && <span className="text-xs text-gray-400">Loading…</span>}
            {!isLoading && emergencyBoard.length === 0 && (
              <span className="text-xs text-gray-400">No emergencies</span>
            )}
            {emergencyBoard.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => void openEncounter(row.id)}
                className={`text-left text-xs px-2.5 py-1.5 rounded-sm border ${
                  selectedId === row.id
                    ? "border-[#C62828] bg-red-50 text-[#C62828] font-bold"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {row.patientName || row.fullName || row.id.slice(0, 8)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Cold-case queue
            </h3>
            <Badge variant={windowOpen ? "live" : "priority"}>
              {windowOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isLoading && coldBoard.length === 0 && (
              <span className="text-xs text-gray-400">No cold cases waiting</span>
            )}
            {coldBoard.map((row) => (
              <button
                key={row.id}
                type="button"
                disabled={!windowOpen}
                onClick={() => void openEncounter(row.id)}
                className={`text-left text-xs px-2.5 py-1.5 rounded-sm border disabled:opacity-40 ${
                  selectedId === row.id
                    ? "border-[#C62828] bg-red-50 text-[#C62828] font-bold"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {row.patientName || row.fullName || row.id.slice(0, 8)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedId && (
        <div className="bg-white border border-dashed border-gray-300 rounded-sm p-10 text-center text-sm text-gray-400">
          Select an emergency or cold-case patient to open the consultation canvas.
        </div>
      )}

      {selectedId && (
        <div className="space-y-4">
          <PatientBanner
            patient={patientHeader || undefined}
            referral={referral}
            onReferralChange={setReferral}
          />

          <VitalTelemetry vitals={vitalsToMetrics(vitals)} />

          {labResults.length > 0 && (
            <p className="text-xs text-surface-muted px-1">
              Lab on file:{" "}
              {labResults.map((r) => r.testName || r.conclusion || "result").join(", ")}
            </p>
          )}

          <ConsultationWorkspace
            soapNotes={soapNotes}
            onSoapNotesChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setSoapNotes((prev) => ({ ...prev, [e.target.name]: e.target.value }))
            }
            prescriptions={prescriptions}
            onAddPrescription={() =>
              setPrescriptions((prev) => [
                ...prev,
                {
                  id: `p-${Date.now()}`,
                  name: "",
                  dosage: "",
                  frequency: "As directed",
                  durationDays: 5,
                  route: "Oral",
                  instructions: "",
                },
              ])
            }
            onRemovePrescription={(id) =>
              setPrescriptions((prev) => prev.filter((d) => d.id !== id))
            }
            onPrescriptionChange={(id, patch) =>
              setPrescriptions((prev) =>
                prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
              )
            }
            diagnostics={diagnostics}
            onDiagnosticToggle={(field) =>
              setDiagnostics((prev) => ({ ...prev, [field]: !prev[field] }))
            }
            onInstructionsChange={(e) =>
              setDiagnostics((prev) => ({
                ...prev,
                additionalInstructions: e.target.value,
              }))
            }
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 pt-4">
            <p className="text-[11px] text-gray-400">
              {selectedIsEmergency
                ? "Emergency consult — window not required"
                : windowOpen
                  ? "Cold-case window open"
                  : "Cold-case window closed"}
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => toast.info("Draft kept on this screen only (not sent).")}
              >
                Save Draft
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting || !canConsult}
                onClick={() => void handleFinalize()}
                className="bg-[#B71C1C] hover:bg-[#991B1B]"
              >
                {isSubmitting ? "Submitting..." : "Finalize Consultation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
