import type {
  ConsultationRecord,
  ContactTrace,
  ContactTraceDTO,
  CreateConsultationDTO,
  Encounter,
  EncounterChart,
  EncounterVitals,
  OpenEncounterDTO,
  RecordVitalsDTO,
  UpdateEncounterStatusDTO,
} from "@src/dto/encounter";
import type {
  AdmissionType,
  EncounterListQuery,
  EncounterStatus,
} from "@src/dto/common";
import { API_V1 } from "@src/constants/api";
import http from "@src/services/http";
import { asList, unwrapData } from "@src/services/service-utils";
import { normalizeApiError } from "@src/utils/api-error";

function isChartPayload(value: unknown): value is EncounterChart {
  return Boolean(
    value &&
      typeof value === "object" &&
      "encounter" in value &&
      (value as EncounterChart).encounter &&
      typeof (value as EncounterChart).encounter === "object"
  );
}

function flattenEncounter(chart: EncounterChart): Encounter {
  const patientName = chart.patient?.fullName;
  return {
    ...chart.encounter,
    patientName: patientName || chart.encounter.patientName,
    fullName: patientName || chart.encounter.fullName,
  };
}

function readField(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function readNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** List rows may be flat, PascalCase, or chart envelopes without a top-level id. */
export function normalizeEncounter(raw: unknown): Encounter | null {
  const record = asRecord(raw);
  if (!record) return null;

  const nested = asRecord(record.encounter) || asRecord(record.Encounter);
  const source = nested ? { ...nested } : record;
  const patient =
    asRecord(record.patient) ||
    asRecord(record.Patient) ||
    asRecord(source.patient) ||
    asRecord(source.Patient);

  const id =
    readField(source, "id", "Id", "encounterId", "EncounterId") ||
    readField(record, "id", "Id", "encounterId", "EncounterId");
  if (!id) return null;

  const patientName =
    readField(source, "patientName", "PatientName", "fullName", "FullName", "name", "Name") ||
    readField(patient || {}, "fullName", "FullName", "name", "Name", "patientName", "PatientName");

  return {
    ...(source as unknown as Encounter),
    id,
    patientId:
      readField(source, "patientId", "PatientId") ||
      readField(patient || {}, "id", "Id", "patientId", "PatientId"),
    status: readField(source, "status", "Status") as EncounterStatus | undefined,
    admissionType: readField(
      source,
      "admissionType",
      "AdmissionType",
      "type",
      "Type"
    ) as AdmissionType | undefined,
    patientName,
    fullName: patientName,
    chiefComplaint: readField(source, "chiefComplaint", "ChiefComplaint"),
    createdAt: readField(source, "createdAt", "CreatedAt", "admittedAt", "AdmittedAt"),
  };
}

function normalizeVitals(raw: unknown): EncounterVitals | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    id: readField(record, "id", "Id"),
    encounterId: readField(record, "encounterId", "EncounterId"),
    recordedBy: readField(record, "recordedBy", "RecordedBy"),
    bloodPressureSystolic: readNumber(
      record,
      "bloodPressureSystolic",
      "BloodPressureSystolic",
      "systolic",
      "Systolic"
    ),
    bloodPressureDiastolic: readNumber(
      record,
      "bloodPressureDiastolic",
      "BloodPressureDiastolic",
      "diastolic",
      "Diastolic"
    ),
    pulseRate: readNumber(record, "pulseRate", "PulseRate", "pulse", "Pulse"),
    temperature: readNumber(
      record,
      "temperature",
      "Temperature",
      "temperatureCelsius",
      "TemperatureCelsius"
    ),
    spo2: readNumber(record, "spo2", "Spo2", "SpO2", "oxygenSaturation"),
    respiratoryRate: readNumber(
      record,
      "respiratoryRate",
      "RespiratoryRate"
    ),
    weight: readNumber(record, "weight", "Weight", "weightKg", "WeightKg"),
    notes: readField(record, "notes", "Notes") ?? null,
    recordedAt: readField(record, "recordedAt", "RecordedAt", "createdAt", "CreatedAt"),
  };
}

function normalizeListQuery(query: EncounterListQuery = {}): EncounterListQuery {
  const params: EncounterListQuery = { ...query };
  // Live API 500s on `date`; from/to work.
  if (params.date) {
    if (!params.from) params.from = params.date;
    if (!params.to) params.to = params.date;
    delete params.date;
  }
  return params;
}

class EncountersService {
  private handleError(err: unknown): never {
    throw normalizeApiError(err);
  }

  async open(payload: OpenEncounterDTO) {
    try {
      const response = await http.post(`${API_V1}/encounters`, payload);
      const data = unwrapData<Encounter | EncounterChart>(response.data);
      return normalizeEncounter(data) || (isChartPayload(data) ? flattenEncounter(data) : (data as Encounter));
    } catch (err) {
      this.handleError(err);
    }
  }

  /** Full chart from GET /encounters/{id}. */
  async getChart(encounterId: string): Promise<EncounterChart> {
    try {
      const response = await http.get(`${API_V1}/encounters/${encounterId}`);
      const data = unwrapData<Encounter | EncounterChart>(response.data);
      if (isChartPayload(data)) {
        const encounter = normalizeEncounter(data) || flattenEncounter(data);
        return {
          ...data,
          encounter,
          vitals: (Array.isArray(data.vitals) ? data.vitals : asList<unknown>(data.vitals))
            .map((row) => normalizeVitals(row))
            .filter((row): row is EncounterVitals => Boolean(row)),
        } satisfies EncounterChart;
      }
      const encounter = normalizeEncounter(data) || (data as Encounter);
      return { encounter } satisfies EncounterChart;
    } catch (err) {
      this.handleError(err);
    }
  }

  async getById(encounterId: string) {
    const chart = await this.getChart(encounterId);
    return chart.encounter;
  }

  async list(query: EncounterListQuery = {}) {
    try {
      const response = await http.get(`${API_V1}/encounters`, {
        params: normalizeListQuery(query),
      });
      return asList<unknown>(response.data)
        .map((row) => normalizeEncounter(row))
        .filter((row): row is Encounter => Boolean(row?.id));
    } catch (err) {
      this.handleError(err);
    }
  }

  async listByStatus(status: EncounterStatus) {
    return this.list({ status });
  }

  async updateStatus(encounterId: string, payload: UpdateEncounterStatusDTO) {
    try {
      const response = await http.patch(
        `${API_V1}/encounters/${encounterId}/status`,
        payload
      );
      const data = unwrapData<Encounter | EncounterChart>(response.data);
      if (isChartPayload(data)) return flattenEncounter(data);
      return data as Encounter;
    } catch (err) {
      this.handleError(err);
    }
  }

  async getVitals(encounterId: string) {
    try {
      const response = await http.get(
        `${API_V1}/encounters/${encounterId}/vitals`
      );
      return asList<unknown>(response.data)
        .map((row) => normalizeVitals(row))
        .filter((row): row is EncounterVitals => Boolean(row));
    } catch (err) {
      this.handleError(err);
    }
  }

  async getLatestVitals(encounterId: string) {
    try {
      const response = await http.get(
        `${API_V1}/encounters/${encounterId}/vitals/latest`
      );
      return normalizeVitals(unwrapData<unknown>(response.data));
    } catch (err) {
      this.handleError(err);
    }
  }

  async recordVitals(encounterId: string, payload: RecordVitalsDTO) {
    try {
      const response = await http.post(
        `${API_V1}/encounters/${encounterId}/vitals`,
        payload
      );
      return normalizeVitals(unwrapData<unknown>(response.data));
    } catch (err) {
      this.handleError(err);
    }
  }

  async getConsultation(encounterId: string) {
    try {
      const response = await http.get(
        `${API_V1}/encounters/${encounterId}/consultation`
      );
      return unwrapData<ConsultationRecord>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async createConsultation(encounterId: string, payload: CreateConsultationDTO) {
    try {
      const response = await http.post(
        `${API_V1}/encounters/${encounterId}/consultation`,
        payload
      );
      return unwrapData<ConsultationRecord>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async getContactTrace(encounterId: string) {
    try {
      const response = await http.get(
        `${API_V1}/encounters/${encounterId}/contact-trace`
      );
      return unwrapData<ContactTrace>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async createContactTrace(encounterId: string, payload: ContactTraceDTO) {
    try {
      const response = await http.post(
        `${API_V1}/encounters/${encounterId}/contact-trace`,
        payload
      );
      return unwrapData<ContactTrace>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async updateContactTrace(encounterId: string, payload: ContactTraceDTO) {
    try {
      const response = await http.patch(
        `${API_V1}/encounters/${encounterId}/contact-trace`,
        payload
      );
      return unwrapData<ContactTrace>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }
}

const encountersService = new EncountersService();
export default encountersService;
