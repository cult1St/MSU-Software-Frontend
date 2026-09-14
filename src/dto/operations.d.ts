export interface QueueEntry {
  encounterId?: string;
  id?: string;
  patientId?: string;
  patientName?: string;
  fullName?: string;
  status?: string;
  position?: number;
  estimatedWaitMinutes?: number;
  admissionType?: string;
}

export interface QueuePosition {
  encounterId?: string;
  position?: number;
  estimatedWaitMinutes?: number;
}

export interface ServiceWindow {
  id?: string;
  date?: string;
  isOpen?: boolean;
  coldCaseOpenTime?: string;
  coldCaseCloseTime?: string;
  opensAt?: string;
  closesAt?: string;
  label?: string;
  message?: string;
  createdBy?: string;
}

/** Live GET /service-window/current envelope. */
export interface ServiceWindowCurrent {
  isOpen?: boolean;
  window?: ServiceWindow | null;
}

export interface SetServiceWindowDTO {
  date: string;
  coldCaseOpenTime: string;
  coldCaseCloseTime: string;
  createdBy: string;
}

export interface UpdateServiceWindowDTO {
  coldCaseOpenTime: string;
  coldCaseCloseTime: string;
}

export interface DrugRegisterEntry {
  id?: string;
  handoverId?: string;
  encounterId?: string;
  prescriptionId?: string;
  drugName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  batchNumber?: string;
  quantity?: number;
  quantityDispensed?: number;
  expiryDate?: string;
  handoverAt?: string;
}
