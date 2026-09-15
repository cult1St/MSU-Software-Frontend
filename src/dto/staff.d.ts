import type { ApiStaffRole } from "@src/dto/auth";

export type StaffRole = ApiStaffRole;

export interface StaffMember {
  id: string;
  fullName?: string | null;
  email?: string | null;
  role?: StaffRole | string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateStaffDTO {
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
}

export interface UpdateStaffDTO {
  fullName?: string | null;
  email?: string | null;
  role?: StaffRole;
  isActive?: boolean;
  password?: string | null;
}

export interface StaffListQuery {
  role?: StaffRole;
  isActive?: boolean;
}
