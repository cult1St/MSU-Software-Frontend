export type ValidationErrors = Record<string, string>;

export interface ErrorResponse {
  message: string;
  errors?: ValidationErrors;
  status?: number;
  success?: boolean;
}

export interface SuccessResponse<T> {
  message?: string;
  data: T;
  success?: boolean;
}

export type EncounterStatus =
  | "Admitted"
  | "InTreatment"
  | "Registered"
  | "BpCheck"
  | "Queued"
  | "InConsultation"
  | "PharmacyPending"
  | "LabPending"
  | "DressingPending"
  | "AwaitingHandover"
  | "Discharged"
  | "Referred";

export type AdmissionType = "Emergency" | "ColdCase";

export type ArrivalMode = "WalkedIn" | "Stretcher" | "Supported";

export type DrugRoute = "Oral" | "IV" | "IM" | "Topical";

export type DressingOrderStatus = "Pending" | "InProgress" | "Completed";

export type LabRequestStatus = "Pending" | "InProgress" | "Completed" | "Cancelled";

export type PrescriptionStatus = "Pending" | "Dispensed" | "HandedOver";

export interface EncounterListQuery {
  status?: EncounterStatus;
  type?: AdmissionType;
  /** Inclusive lower bound (YYYY-MM-DD). Prefer over `date` — live API 500s on `date`. */
  from?: string;
  /** Inclusive upper bound (YYYY-MM-DD). */
  to?: string;
  /** @deprecated Live API returns 500 when `date` is sent; mapped to from/to in the service. */
  date?: string;
}

export interface DateStatusQuery {
  status?: string;
  date?: string;
}

export interface PatientSearchQuery {
  name?: string;
  phone?: string;
}

export interface DrugRegisterQuery {
  date?: string;
  page?: number;
  limit?: number;
}

export interface DrugRegisterExportQuery {
  date?: string;
  format?: string;
}
