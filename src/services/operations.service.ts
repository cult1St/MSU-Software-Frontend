import type {
  DrugRegisterEntry,
  QueueEntry,
  QueuePosition,
  ServiceWindow,
  ServiceWindowCurrent,
  SetServiceWindowDTO,
  UpdateServiceWindowDTO,
} from "@src/dto/operations";
import type {
  DrugRegisterExportQuery,
  DrugRegisterQuery,
} from "@src/dto/common";
import { API_V1 } from "@src/constants/api";
import http from "@src/services/http";
import { asList, unwrapData } from "@src/services/service-utils";
import { normalizeApiError } from "@src/utils/api-error";

function flattenServiceWindow(
  data: ServiceWindowCurrent | ServiceWindow | null | undefined
): ServiceWindow | null {
  if (!data) return null;
  if ("window" in data) {
    const wrapped = data as ServiceWindowCurrent;
    return {
      ...(wrapped.window || {}),
      isOpen:
        typeof wrapped.isOpen === "boolean"
          ? wrapped.isOpen
          : wrapped.window?.isOpen,
    };
  }
  return data as ServiceWindow;
}

class OperationsService {
  private handleError(err: unknown): never {
    throw normalizeApiError(err);
  }

  async getServiceWindow() {
    try {
      const response = await http.get(`${API_V1}/service-window/current`);
      return flattenServiceWindow(
        unwrapData<ServiceWindowCurrent | ServiceWindow>(response.data)
      );
    } catch (err) {
      this.handleError(err);
    }
  }

  async createServiceWindow(payload: SetServiceWindowDTO) {
    try {
      const response = await http.post(`${API_V1}/service-window`, payload);
      return flattenServiceWindow(
        unwrapData<ServiceWindowCurrent | ServiceWindow>(response.data)
      );
    } catch (err) {
      this.handleError(err);
    }
  }

  async updateServiceWindow(windowId: string, payload: UpdateServiceWindowDTO) {
    try {
      const response = await http.patch(
        `${API_V1}/service-window/${windowId}`,
        payload
      );
      return flattenServiceWindow(
        unwrapData<ServiceWindowCurrent | ServiceWindow>(response.data)
      );
    } catch (err) {
      this.handleError(err);
    }
  }

  async getQueue() {
    try {
      const response = await http.get(`${API_V1}/queue`);
      return asList<QueueEntry>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async joinQueue(encounterId: string) {
    try {
      const response = await http.post(`${API_V1}/queue/${encounterId}/join`);
      return unwrapData<QueueEntry>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async leaveQueue(encounterId: string) {
    try {
      const response = await http.delete(`${API_V1}/queue/${encounterId}`);
      return unwrapData<unknown>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async getQueuePosition(encounterId: string) {
    try {
      const response = await http.get(
        `${API_V1}/queue/${encounterId}/position`
      );
      return unwrapData<QueuePosition>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async listDrugRegister(query: DrugRegisterQuery | number = {}, limit = 50) {
    try {
      const params: DrugRegisterQuery =
        typeof query === "number"
          ? { page: query, limit }
          : { page: 1, limit: 50, ...query };
      const response = await http.get(`${API_V1}/register/drugs`, { params });
      return asList<DrugRegisterEntry>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async exportDrugRegister(query: DrugRegisterExportQuery = { format: "csv" }) {
    try {
      const response = await http.get(`${API_V1}/register/drugs/export`, {
        params: { format: "csv", ...query },
        responseType: "blob",
      });
      return response.data as Blob;
    } catch (err) {
      this.handleError(err);
    }
  }

  async exportDrugRegisterCsv() {
    return this.exportDrugRegister({ format: "csv" });
  }
}

const operationsService = new OperationsService();
export default operationsService;
