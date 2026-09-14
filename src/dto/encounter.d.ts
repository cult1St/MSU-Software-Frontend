import type {
  AdmissionType,
  ArrivalMode,
  DrugRoute,
  EncounterStatus,
} from "./common";

export interface OpenEncounterDTO {
  patientId: string;
  admissionType: AdmissionType;
  arrivalMode: ArrivalMode;
  chiefComplaint?: string | null;
  registeredBy: string;
}

export interface UpdateEncounterStatusDTO {
  status: EncounterStatus;
}

export interface Encounter {
  id: string;
  patientId?: string;
  status?: EncounterStatus;
  admissionType?: AdmissionType;
  arrivalMode?: ArrivalMode;
  chiefComplaint?: string;
  patientName?: string;
  fullName?: string;
  registeredBy?: string;
  admittedAt?: string;
  dischargedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /encounters/{id} returns a chart envelope, not a flat encounter. */
export interface EncounterChart {
  encounter: Encounter;
  patient?: {
    id?: string;
    fullName?: string;
    age?: number;
    sex?: string;
    phone?: string;
    address?: string;
    nextOfKinName?: string;
    nextOfKinPhone?: string;
    nextOfKinRelationship?: string;
    createdAt?: string;
  } | null;
  vitals?: EncounterVitals[];
  consultation?: ConsultationRecord | null;
  prescriptions?: unknown[];
  labRequests?: unknown[];
  labResults?: unknown[];
  dressingOrders?: unknown[];
  contactTrace?: ContactTrace | null;
}

export interface RecordVitalsDTO {
  recordedBy: string;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  pulseRate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  respiratoryRate?: number | null;
  weight?: number | null;
  notes?: string | null;
}

export interface EncounterVitals {
  id?: string;
  encounterId?: string;
  recordedBy?: string;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  pulseRate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  respiratoryRate?: number | null;
  weight?: number | null;
  notes?: string | null;
  recordedAt?: string;
}

export interface PrescriptionLineDTO {
  drugName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  route?: DrugRoute;
  instructions?: string | null;
}

export interface LabTestPlanDTO {
  testName?: string | null;
  clinicalIndication?: string | null;
}

export interface TreatmentPlanDTO {
  prescriptions?: PrescriptionLineDTO[] | null;
  labTests?: LabTestPlanDTO[] | null;
  requiresDressing: boolean;
  dressingInstructions?: string | null;
  isReferral: boolean;
  referralFacility?: string | null;
  referralReason?: string | null;
}

export interface CreateConsultationDTO {
  doctorId: string;
  diagnosis?: string[] | null;
  clinicalNotes?: string | null;
  treatmentPlan?: TreatmentPlanDTO;
}

export interface ConsultationRecord {
  id?: string;
  encounterId?: string;
  doctorId?: string;
  diagnosis?: string[];
  clinicalNotes?: string;
  treatmentPlan?: TreatmentPlanDTO;
}

export interface ContactTraceDTO {
  recordedBy: string;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelationship?: string | null;
  residentialAddress?: string | null;
  workplaceAddress?: string | null;
  dischargeNotes?: string | null;
  referralDestination?: string | null;
}

export interface ContactTrace extends ContactTraceDTO {
  id?: string;
  encounterId?: string;
  recordedAt?: string;
  updatedAt?: string;
}
