import type { ArrivalMode } from "@src/dto/common";

export type CaseType = "STANDARD" | "EMERGENCY";

export interface RegistrationFormData {
  fullName: string;
  age: string;
  sex: string;
  phone: string;
  address: string;
  identificationId?: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  chiefComplaint: string;
  arrivalMode: ArrivalMode;
  caseType: CaseType;
}
