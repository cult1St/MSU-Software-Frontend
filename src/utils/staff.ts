const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STORAGE_KEY = "gilead.staffIds";

export type StaffRole =
  | "registrar"
  | "nurse"
  | "doctor"
  | "pharmacist"
  | "protocolOfficer"
  | "scientist"
  | "dressingNurse";

const envStaff: Record<StaffRole, string> = {
  registrar: process.env.NEXT_PUBLIC_STAFF_REGISTRAR_ID || "",
  nurse: process.env.NEXT_PUBLIC_STAFF_NURSE_ID || "",
  doctor: process.env.NEXT_PUBLIC_STAFF_DOCTOR_ID || "",
  pharmacist: process.env.NEXT_PUBLIC_STAFF_PHARMACIST_ID || "",
  protocolOfficer: process.env.NEXT_PUBLIC_STAFF_PROTOCOL_OFFICER_ID || "",
  scientist: process.env.NEXT_PUBLIC_STAFF_SCIENTIST_ID || "",
  dressingNurse: process.env.NEXT_PUBLIC_STAFF_DRESSING_NURSE_ID || "",
};

function readStored(): Partial<Record<StaffRole, string>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<StaffRole, string>>) : {};
  } catch {
    return {};
  }
}

export function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value.trim()));
}

export function getStaffId(role: StaffRole): string {
  const stored = readStored()[role];
  if (isUuid(stored)) return stored.trim();
  const fromEnv = envStaff[role];
  return isUuid(fromEnv) ? fromEnv.trim() : "";
}

export function setStaffId(role: StaffRole, value: string) {
  if (typeof window === "undefined") return;
  const next = { ...readStored(), [role]: value.trim() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function requireStaffId(role: StaffRole, label?: string): string {
  const id = getStaffId(role);
  if (!isUuid(id)) {
    const names: Record<StaffRole, string> = {
      registrar: "registrar",
      nurse: "nurse",
      doctor: "doctor",
      pharmacist: "pharmacist",
      protocolOfficer: "protocol officer",
      scientist: "lab scientist",
      dressingNurse: "dressing nurse",
    };
    throw new Error(
      `${label || names[role]} is not configured. Ask an administrator to set duty staff.`
    );
  }
  return id;
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
