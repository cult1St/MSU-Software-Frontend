import type { LoginDTO, AuthUser } from "@src/dto/auth";
import { API_V1 } from "@src/constants/api";
import http from "@src/services/http";
import { unwrapData } from "@src/services/service-utils";
import { normalizeApiError } from "@src/utils/api-error";
import { normalizeStaffRole } from "@src/utils/roles";

type AuthRecord = Record<string, unknown>;

function asRecord(value: unknown): AuthRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as AuthRecord;
}

function normalizeUser(raw: AuthRecord | undefined): AuthUser | null {
  if (!raw) return null;
  const id = raw.id != null ? String(raw.id) : undefined;
  const fullName =
    (raw.fullName as string | undefined) ||
    (raw.name as string | undefined) ||
    [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
    undefined;
  const roleRaw = (raw.role as string | undefined) || undefined;
  const role = normalizeStaffRole(roleRaw) || roleRaw;

  const user: AuthUser = {
    id,
    firstName: raw.firstName as string | undefined,
    lastName: raw.lastName as string | undefined,
    fullName,
    name: fullName,
    email: raw.email as string | undefined,
    phone: raw.phone as string | undefined,
    role,
    address: raw.address as string | undefined,
    isActive: raw.isActive as boolean | undefined,
  };

  if (!user.id && !user.email && !user.name) return null;
  return user;
}

class AuthService {
  private getPayloadData(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return undefined;
    }

    const root = payload as AuthRecord;
    return (root.data as AuthRecord | undefined) ?? root;
  }

  private saveAuthSession(payload: unknown) {
    if (typeof window === "undefined") {
      return;
    }

    const data = this.getPayloadData(payload);
    if (!data) {
      return;
    }

    const token =
      (data.token as string | undefined) ??
      (data.authToken as string | undefined) ??
      (data.accessToken as string | undefined) ??
      (data.access_token as string | undefined) ??
      (data.jwt as string | undefined);

    const userRaw =
      asRecord(data.user) ??
      asRecord(data.staff) ??
      asRecord(data.profile) ??
      (data.id || data.email || data.role ? data : undefined);

    const user = normalizeUser(userRaw);

    if (token) {
      sessionStorage.setItem("authToken", token);
    }

    if (user) {
      sessionStorage.setItem("authUser", JSON.stringify(user));
    }
  }

  private handleError(err: unknown): never {
    throw normalizeApiError(err);
  }

  async login(formData: LoginDTO) {
    try {
      const response = await http.post(`${API_V1}/auth/login`, formData);
      this.saveAuthSession(response.data);
      return unwrapData(response.data) ?? response.data;
    } catch (err) {
      this.handleError(err);
    }
  }

  async logout() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("authUser");
    }

    return { message: "Logged out" };
  }

  getStoredToken() {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("authToken");
  }

  getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("authUser");
    if (!raw) return null;
    try {
      return normalizeUser(JSON.parse(raw) as AuthRecord);
    } catch {
      return null;
    }
  }
}

const authService = new AuthService();
export default authService;
