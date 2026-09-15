export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  address: string;
  email: string;
  password: string;
}

/** OpenAPI StaffRole enum. */
export type ApiStaffRole =
  | "Doctor"
  | "Pharmacist"
  | "Nurse"
  | "Scientist"
  | "ProtocolOfficer"
  | "Registrar"
  | "DressingNurse";

export interface AuthUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: ApiStaffRole | string;
  address?: string;
  isActive?: boolean;
}
