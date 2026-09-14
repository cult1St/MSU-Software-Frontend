"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import DispensingQueue from "@src/components/pharmacy/DispensingQueue";
import ProtocolHandover from "@src/components/pharmacy/ProtocolHandover";
import LabRequestsPanel from "@src/components/pharmacy/LabRequests";
import {
  DispenseForm,
  DispenseQueueItem,
  HandoverBatch,
  LabRequestItem,
  LabResultDraft,
} from "@src/types/pharmacy";
import pharmacyService from "@src/services/pharmacy.service";
import labService from "@src/services/lab.service";
import encountersService from "@src/services/encounters.service";
import { getApiErrorMessage } from "@src/utils/api-error";
import { requireStaffId } from "@src/utils/staff";

const emptyDispense: DispenseForm = {
  quantityDispensed: 1,
  batchNumber: "",
  expiryDate: "",
  notes: "",
};

const emptyLabDraft: LabResultDraft = {
  findings: "",
  conclusion: "",
  parameter: "",
  value: "",
  unit: "",
  referenceRange: "",
};

function mapPrescriptions(
  rows: Awaited<ReturnType<typeof pharmacyService.listPrescriptions>>
): DispenseQueueItem[] {
  return (rows || []).map((row) => ({
    id: row.id,
    patientName: row.patientName || "Unknown patient",
    patientId: row.patientId || row.encounterId || row.id,
    medicationName: row.drugName || "Prescription",
    dosageDetails: [row.dosage, row.frequency, row.duration]
      .filter(Boolean)
      .join(" · ") || "Pending details",
    encounterId: row.encounterId,
    isUrgentStat: Boolean(row.isUrgent),
  }));
}

function mapLabStatus(status?: string): LabRequestItem["status"] {
  const value = (status || "Pending").toLowerCase();
  if (value === "completed") return "COMPLETED";
  if (value === "inprogress") return "PROCESSING";
  return "PENDING";
}

export default function PharmacyAndLabPage() {
  const [dispenseQueue, setDispenseQueue] = useState<DispenseQueueItem[]>([]);
  const [labRequests, setLabRequests] = useState<LabRequestItem[]>([]);
  const [handoverBatches, setHandoverBatches] = useState<HandoverBatch[]>([]);
  const [completedLabCount, setCompletedLabCount] = useState(0);
  const [selectedRx, setSelectedRx] = useState("");
  const [selectedEncounterId, setSelectedEncounterId] = useState("");
  const [dispenseForm, setDispenseForm] = useState<DispenseForm>(emptyDispense);
  const [selectedLab, setSelectedLab] = useState("");
  const [labDraft, setLabDraft] = useState<LabResultDraft>(emptyLabDraft);
  const [filterDate, setFilterDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prescriptions, handovers, labs, completedLabs] = await Promise.all([
        pharmacyService.listPrescriptions({ status: "Pending", date: filterDate || undefined }).catch(() => []),
        pharmacyService.listHandovers("Pending").catch(() => []),
        labService.listRequests({ status: "Pending", date: filterDate || undefined }).catch(() => []),
        labService.listRequests({ status: "Completed", date: filterDate || undefined }).catch(() => []),
      ]);

      setDispenseQueue(mapPrescriptions(prescriptions));
      setCompletedLabCount((completedLabs || []).length);
      setHandoverBatches(
        (handovers || []).map((row) => ({
          id: row.id,
          timestamp: row.createdAt
            ? new Date(row.createdAt).toLocaleTimeString()
            : "—",
          patientName: row.patientName || "Unknown",
          patientId: row.patientId || row.encounterId || row.id,
          itemsDescription: row.itemsDescription || "Medication package",
          patientNameVerified: false,
          drugListVerified: false,
          dosageCounsellingDone: false,
          durationCounsellingDone: false,
          counsellingNotes: "",
        }))
      );
      setLabRequests(
        (labs || []).map((row) => ({
          id: row.id,
          testName: row.testName || "Lab request",
          patientName: row.patientName || "Unknown",
          patientId: row.patientId || row.encounterId || row.id,
          status: mapLabStatus(row.status),
        }))
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load pharmacy board"));
    } finally {
      setIsLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelectPrescription = async (id: string) => {
    setSelectedRx(id);
    try {
      const detail = await pharmacyService.getPrescription(id);
      setSelectedEncounterId(detail.encounterId || "");
      setDispenseForm({
        quantityDispensed: 1,
        batchNumber: "",
        expiryDate: "",
        notes: [detail.dosage, detail.instructions].filter(Boolean).join(" · "),
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load prescription"));
    }
  };

  const handleDispenseAction = async (id: string, isUrgent: boolean) => {
    if (!dispenseForm.expiryDate || !dispenseForm.quantityDispensed) {
      toast.error("Quantity and expiry date are required");
      return;
    }
    try {
      const encounterId =
        selectedEncounterId ||
        dispenseQueue.find((row) => row.id === id)?.encounterId;
      await pharmacyService.dispense(id, {
        pharmacistId: requireStaffId("pharmacist", "pharmacistId"),
        quantityDispensed: dispenseForm.quantityDispensed,
        batchNumber: dispenseForm.batchNumber || null,
        expiryDate: dispenseForm.expiryDate,
        notes: dispenseForm.notes || (isUrgent ? "Urgent dispense" : null),
      });
      if (encounterId) {
        try {
          await encountersService.updateStatus(encounterId, {
            status: "AwaitingHandover",
          });
        } catch (statusError) {
          toast.warn(
            getApiErrorMessage(
              statusError,
              "Dispensed, but could not mark AwaitingHandover"
            )
          );
        }
      }
      setSelectedRx("");
      setSelectedEncounterId("");
      setDispenseForm(emptyDispense);
      toast.success(
        isUrgent
          ? "Urgent drugs dispensed — hand to protocol for counselling"
          : "Drugs dispensed — hand to protocol for counselling"
      );
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to dispense prescription"));
    }
  };

  const handleSelectLab = async (id: string) => {
    setSelectedLab(id);
    try {
      const detail = await labService.getRequest(id);
      setLabDraft({
        ...emptyLabDraft,
        parameter: detail.testName || "Result",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load lab request"));
    }
  };

  const handleSubmitLabResult = async (id: string) => {
    try {
      const current = labRequests.find((req) => req.id === id);
      await labService.submitResult(id, {
        scientistId: requireStaffId("scientist", "scientistId"),
        testName: current?.testName || labDraft.parameter || "Lab Test",
        findings: labDraft.findings || null,
        values: [
          {
            parameter: labDraft.parameter || current?.testName || "Result",
            value: labDraft.value || null,
            unit: labDraft.unit || null,
            referenceRange: labDraft.referenceRange || null,
          },
        ],
        conclusion: labDraft.conclusion || null,
      });
      setSelectedLab("");
      setLabDraft(emptyLabDraft);
      toast.success("Lab result posted");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to post lab result"));
    }
  };

  const handleSubmitProtocolHandover = async () => {
    setIsSubmitting(true);
    try {
      const confirmed = handoverBatches.filter(
        (b) =>
          b.patientNameVerified &&
          b.drugListVerified &&
          b.dosageCounsellingDone &&
          b.durationCounsellingDone
      );
      for (const batch of confirmed) {
        const detail = await pharmacyService.getHandover(batch.id).catch(() => null);
        await pharmacyService.confirmHandover(batch.id, {
          protocolOfficerId: requireStaffId("protocolOfficer", "protocolOfficerId"),
          patientNameVerified: batch.patientNameVerified,
          drugListVerified: batch.drugListVerified,
          dosageCounsellingDone: batch.dosageCounsellingDone,
          durationCounsellingDone: batch.durationCounsellingDone,
          counsellingNotes: batch.counsellingNotes || detail?.itemsDescription || null,
        });
        if (detail?.encounterId) {
          try {
            await encountersService.updateStatus(detail.encounterId, {
              status: "Discharged",
            });
          } catch {
            // Register still fills from handover.
          }
        }
      }
      toast.success("Protocol confirmed name, drugs, and counselling. Entries go to the drug register.");
      void load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to confirm handovers"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col justify-between min-h-full">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Pharmacy & Lab Management
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {isLoading
                ? "Loading live queues..."
                : "Session Active: Unit 04-B · Dispense, then protocol handover"}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-xs"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="px-4 py-2 bg-white border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 rounded-sm text-xs"
            >
              Print Queue Report
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="px-4 py-2 bg-[#B71C1C] text-white font-semibold hover:bg-[#991B1B] rounded-sm text-xs"
            >
              Refresh Board
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 items-start">
          <div className="lg:col-span-2 space-y-6">
            <DispensingQueue
              queue={dispenseQueue}
              selectedId={selectedRx}
              form={dispenseForm}
              onSelect={(id) => void handleSelectPrescription(id)}
              onFormChange={(patch) => setDispenseForm((prev) => ({ ...prev, ...patch }))}
              onDispense={handleDispenseAction}
            />
            <ProtocolHandover
              batches={handoverBatches}
              onToggle={(id, field) =>
                setHandoverBatches((prev) =>
                  prev.map((batch) =>
                    batch.id === id && typeof batch[field] === "boolean"
                      ? { ...batch, [field]: !batch[field] }
                      : batch
                  )
                )
              }
              onNotesChange={(id, notes) =>
                setHandoverBatches((prev) =>
                  prev.map((batch) =>
                    batch.id === id ? { ...batch, counsellingNotes: notes } : batch
                  )
                )
              }
              onSubmitHandover={handleSubmitProtocolHandover}
              isSubmitting={isSubmitting}
            />
          </div>
          <div className="lg:col-span-1">
            <LabRequestsPanel
              requests={labRequests}
              selectedId={selectedLab}
              draft={labDraft}
              completedCount={completedLabCount}
              onSelect={(id) => void handleSelectLab(id)}
              onStart={(id) =>
                setLabRequests((prev) =>
                  prev.map((req) => (req.id === id ? { ...req, status: "PROCESSING" } : req))
                )
              }
              onDraftChange={(patch) => setLabDraft((prev) => ({ ...prev, ...patch }))}
              onSubmitResult={handleSubmitLabResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
