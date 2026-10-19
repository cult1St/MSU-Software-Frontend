"use client";

import { useEffect, useState } from "react";
import {
  HeartPulse,
  Bed,
  UserRoundCheck,
  FlaskConical,
} from "lucide-react";
import { KpiCard } from "@src/components/ui/kpi-card";
import encountersService from "@src/services/encounters.service";
import operationsService from "@src/services/operations.service";
import pharmacyService from "@src/services/pharmacy.service";
import labService from "@src/services/lab.service";
import { useAuth } from "@src/context/auth-context";
import { normalizeStaffRole } from "@src/utils/roles";

function isEmergencyType(value?: string) {
  return String(value || "").toLowerCase().includes("emergency");
}

export default function StatCards() {
  const { role } = useAuth();
  const apiRole = normalizeStaffRole(role);
  const canPharmacy = apiRole === "Pharmacist" || apiRole === "ProtocolOfficer";
  const canLab = apiRole === "Scientist" || apiRole === "Pharmacist";

  const [emergency, setEmergency] = useState("—");
  const [queued, setQueued] = useState("—");
  const [inConsult, setInConsult] = useState("—");
  const [pharmacy, setPharmacy] = useState("—");

  useEffect(() => {
    let active = true;

    async function load() {
      const [emergencies, queue, consult, pharmacyPending, prescriptions, labs] =
        await Promise.all([
          encountersService.list({ type: "Emergency" }).catch(() => []),
          operationsService.getQueue().catch(() => []),
          encountersService.list({ status: "InConsultation" }).catch(() => []),
          encountersService.list({ status: "PharmacyPending" }).catch(() => []),
          canPharmacy
            ? pharmacyService.listPrescriptions({ status: "Pending" }).catch(() => [])
            : Promise.resolve([]),
          canLab
            ? labService.listRequests({ status: "Pending" }).catch(() => [])
            : Promise.resolve([]),
        ]);

      if (!active) return;

      const coldQueue = (queue || []).filter((item) => !isEmergencyType(item.admissionType));
      setEmergency(String((emergencies || []).length).padStart(2, "0"));
      setQueued(String(coldQueue.length).padStart(2, "0"));
      setInConsult(String((consult || []).length).padStart(2, "0"));
      setPharmacy(
        String(
          Math.max(
            (pharmacyPending || []).length,
            (prescriptions || []).length
          ) + (labs || []).length
        ).padStart(2, "0")
      );
    }

    void load();
    return () => {
      active = false;
    };
  }, [canPharmacy, canLab]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Active Emergency"
        value={emergency}
        hint="Critically unstable cases"
        icon={HeartPulse}
        accent
      />
      <KpiCard
        label="Cold Cases"
        value={queued}
        hint="Waiting in queue"
        icon={Bed}
      />
      <KpiCard
        label="In Consultation"
        value={inConsult}
        hint="Active doctor sessions"
        icon={UserRoundCheck}
      />
      <KpiCard
        label="Pharma/Lab Hub"
        value={pharmacy}
        hint={
          canPharmacy || canLab
            ? "Patients in processing"
            : "Encounter queue counts only"
        }
        icon={FlaskConical}
      />
    </div>
  );
}
