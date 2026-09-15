import type { SuccessResponse } from "@src/dto/common";

type UnknownRecord = Record<string, unknown>;

export function unwrapData<T>(payload: unknown): T {
  if (payload == null) {
    return payload as T;
  }

  if (typeof payload !== "object") {
    return payload as T;
  }

  const root = payload as UnknownRecord;
  if ("data" in root && root.data !== undefined) {
    return root.data as T;
  }

  return payload as T;
}

export function asList<T>(payload: unknown): T[] {
  const data = unwrapData<unknown>(payload);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as UnknownRecord;
    for (const key of [
      "items",
      "results",
      "records",
      "queue",
      "prescriptions",
      "requests",
      "orders",
      "encounters",
      "staff",
    ]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

export function asSuccess<T>(payload: unknown): SuccessResponse<T> {
  const data = unwrapData<T>(payload);
  const root =
    payload && typeof payload === "object"
      ? (payload as UnknownRecord)
      : undefined;

  return {
    message: typeof root?.message === "string" ? root.message : undefined,
    success: typeof root?.success === "boolean" ? root.success : undefined,
    data,
  };
}
