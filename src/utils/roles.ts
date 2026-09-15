import type { ApiStaffRole } from "@src/dto/auth";

/** Frontend camelCase actor keys used by requireStaffId. */
export type ActorRole =
  | "registrar"
  | "nurse"
  | "doctor"
  | "pharmacist"
  | "protocolOfficer"
  | "scientist"
  | "dressingNurse";

const API_TO_ACTOR: Record<string, ActorRole> = {
  Doctor: "doctor",
  Pharmacist: "pharmacist",
  Nurse: "nurse",
  Scientist: "scientist",
  ProtocolOfficer: "protocolOfficer",
  Registrar: "registrar",
  DressingNurse: "dressingNurse",
};

const ACTOR_TO_API: Record<ActorRole, ApiStaffRole> = {
  doctor: "Doctor",
  pharmacist: "Pharmacist",
  nurse: "Nurse",
  scientist: "Scientist",
  protocolOfficer: "ProtocolOfficer",
  registrar: "Registrar",
  dressingNurse: "DressingNurse",
};

/** Normalize backend/role strings to OpenAPI StaffRole. */
export function normalizeStaffRole(
  value?: string | null
): ApiStaffRole | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = API_TO_ACTOR[trimmed];
  if (direct) return ACTOR_TO_API[direct];

  const lower = trimmed.toLowerCase().replace(/[\s_-]/g, "");
  const map: Record<string, ApiStaffRole> = {
    doctor: "Doctor",
    pharmacist: "Pharmacist",
    nurse: "Nurse",
    scientist: "Scientist",
    protocolofficer: "ProtocolOfficer",
    registrar: "Registrar",
    dressingnurse: "DressingNurse",
  };
  return map[lower] ?? null;
}

export function toActorRole(role?: string | null): ActorRole | null {
  const api = normalizeStaffRole(role);
  return api ? API_TO_ACTOR[api] : null;
}

export function stationsForRole(role?: string | null): string[] {
  const api = normalizeStaffRole(role);
  switch (api) {
    case "Registrar":
      return ["/in", "/in/protocol", "/in/admin"];
    case "Nurse":
    case "DressingNurse":
      return ["/in", "/in/nurses"];
    case "Doctor":
      return ["/in", "/in/doctors"];
    case "Pharmacist":
    case "Scientist":
      return ["/in", "/in/pharmacy"];
    case "ProtocolOfficer":
      return ["/in", "/in/protocol", "/in/pharmacy"];
    default:
      return ["/in"];
  }
}

export function homeRouteForRole(role?: string | null): string {
  const stations = stationsForRole(role);
  return stations.find((s) => s !== "/in") || stations[0] || "/in";
}

export function canAccessRoute(role: string | null | undefined, path: string): boolean {
  const allowed = stationsForRole(role);
  const clean = path.split("?")[0].replace(/\/$/, "") || "/in";
  return allowed.some((route) => {
    if (route === "/in") return clean === "/in";
    return clean === route || clean.startsWith(`${route}/`);
  });
}

export function canSeeNavItem(
  role: string | null | undefined,
  href: string
): boolean {
  return canAccessRoute(role, href);
}

export function pharmacySections(role?: string | null): {
  dispense: boolean;
  lab: boolean;
  handover: boolean;
} {
  const api = normalizeStaffRole(role);
  return {
    dispense: api === "Pharmacist",
    lab: api === "Scientist",
    handover: api === "ProtocolOfficer",
  };
}

export function nurseSections(role?: string | null): {
  vitals: boolean;
  dressing: boolean;
} {
  const api = normalizeStaffRole(role);
  if (api === "DressingNurse") {
    return { vitals: false, dressing: true };
  }
  if (api === "Nurse") {
    return { vitals: true, dressing: true };
  }
  return { vitals: true, dressing: true };
}

export { ACTOR_TO_API, API_TO_ACTOR };
