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
import type { EncounterListQuery, EncounterStatus } from "@src/dto/common";
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
      if (isChartPayload(data)) return flattenEncounter(data);
      return data as Encounter;
    } catch (err) {
      this.handleError(err);
    }
  }

  /** Full chart from GET /encounters/{id}. */
  async getChart(encounterId: string) {
    try {
      const response = await http.get(`${API_V1}/encounters/${encounterId}`);
      const data = unwrapData<Encounter | EncounterChart>(response.data);
      if (isChartPayload(data)) {
        return {
          ...data,
          encounter: flattenEncounter(data),
        } satisfies EncounterChart;
      }
      return { encounter: data as Encounter } satisfies EncounterChart;
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
      return asList<Encounter>(response.data);
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
      return asList<EncounterVitals>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async getLatestVitals(encounterId: string) {
    try {
      const response = await http.get(
        `${API_V1}/encounters/${encounterId}/vitals/latest`
      );
      return unwrapData<EncounterVitals>(response.data);
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
      return unwrapData<EncounterVitals>(response.data);
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
