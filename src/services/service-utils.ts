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

const LIST_KEYS = [
  "items",
  "results",
  "records",
  "queue",
  "prescriptions",
  "requests",
  "orders",
  "encounters",
  "vitals",
  "vitalSigns",
  "staff",
  "$values",
  "value",
  "data",
];

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const record = data as UnknownRecord;
  for (const key of LIST_KEYS) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }

  if ("data" in record && record.data && record.data !== data) {
    return extractList(record.data);
  }

  return [];
}

export function asList<T>(payload: unknown): T[] {
  return extractList(unwrapData<unknown>(payload)) as T[];
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
