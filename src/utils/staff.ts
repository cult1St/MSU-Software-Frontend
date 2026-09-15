import type { ApiStaffRole } from "@src/dto/auth";
import type { ActorRole } from "@src/utils/roles";
import { toActorRole } from "@src/utils/roles";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STORAGE_KEY = "gilead.staffIds";

/** @deprecated Prefer ActorRole from roles.ts — kept for call-site compatibility. */
export type StaffRole = ActorRole;

const envStaff: Record<ActorRole, string> = {
  registrar: process.env.NEXT_PUBLIC_STAFF_REGISTRAR_ID || "",
  nurse: process.env.NEXT_PUBLIC_STAFF_NURSE_ID || "",
  doctor: process.env.NEXT_PUBLIC_STAFF_DOCTOR_ID || "",
  pharmacist: process.env.NEXT_PUBLIC_STAFF_PHARMACIST_ID || "",
  protocolOfficer: process.env.NEXT_PUBLIC_STAFF_PROTOCOL_OFFICER_ID || "",
  scientist: process.env.NEXT_PUBLIC_STAFF_SCIENTIST_ID || "",
  dressingNurse: process.env.NEXT_PUBLIC_STAFF_DRESSING_NURSE_ID || "",
};

function readStored(): Partial<Record<ActorRole, string>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<ActorRole, string>>) : {};
  } catch {
    return {};
  }
}

export function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value.trim()));
}

function sessionUserId(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = sessionStorage.getItem("authUser");
    if (!raw) return "";
    const user = JSON.parse(raw) as { id?: string; role?: string };
    return isUuid(user.id) ? String(user.id).trim() : "";
  } catch {
    return "";
  }
}

function sessionActorRole(): ActorRole | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("authUser");
    if (!raw) return null;
    const user = JSON.parse(raw) as { role?: string };
    return toActorRole(user.role);
  } catch {
    return null;
  }
}

export function getStaffId(role: ActorRole): string {
  const sessionId = sessionUserId();
  const sessionRole = sessionActorRole();
  if (sessionId && sessionRole === role) {
    return sessionId;
  }

  const stored = readStored()[role];
  if (isUuid(stored)) return stored.trim();
  const fromEnv = envStaff[role];
  return isUuid(fromEnv) ? fromEnv.trim() : "";
}

export function setStaffId(role: ActorRole, value: string) {
  if (typeof window === "undefined") return;
  const next = { ...readStored(), [role]: value.trim() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/**
 * Prefer logged-in staff UUID when their role matches the actor needed.
 * Falls back to localStorage / env.
 */
export function requireStaffId(role: ActorRole, label?: string): string {
  const id = getStaffId(role);
  if (!isUuid(id)) {
    const names: Record<ActorRole, string> = {
      registrar: "registrar",
      nurse: "nurse",
      doctor: "doctor",
      pharmacist: "pharmacist",
      protocolOfficer: "protocol officer",
      scientist: "lab scientist",
      dressingNurse: "dressing nurse",
    };
    throw new Error(
      `${label || names[role]} is not available. Sign in as that role.`
    );
  }
  return id;
}

/** Logged-in staff UUID regardless of role (for createdBy / registeredBy when role matches). */
export function getSessionStaffId(): string {
  return sessionUserId();
}

export function getSessionApiRole(): ApiStaffRole | null {
  const actor = sessionActorRole();
  if (!actor) return null;
  const map: Record<ActorRole, ApiStaffRole> = {
    doctor: "Doctor",
    pharmacist: "Pharmacist",
    nurse: "Nurse",
    scientist: "Scientist",
    protocolOfficer: "ProtocolOfficer",
    registrar: "Registrar",
    dressingNurse: "DressingNurse",
  };
  return map[actor];
}

/** ASP.NET TimeOnly / TimeSpan JSON: HH:mm:ss */
export function toAspNetTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.slice(0, 8);
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
}

export function toAspNetDate(value: string): string {
  return value.trim().slice(0, 10);
}
