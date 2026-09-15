import type {
  CreateStaffDTO,
  StaffListQuery,
  StaffMember,
  UpdateStaffDTO,
} from "@src/dto/staff";
import { API_V1 } from "@src/constants/api";
import http from "@src/services/http";
import { asList, unwrapData } from "@src/services/service-utils";
import { normalizeApiError } from "@src/utils/api-error";

class StaffService {
  private handleError(err: unknown): never {
    throw normalizeApiError(err);
  }

  async list(query?: StaffListQuery) {
    try {
      const response = await http.get(`${API_V1}/staff`, { params: query });
      return asList<StaffMember>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async getById(staffId: string) {
    try {
      const response = await http.get(`${API_V1}/staff/${staffId}`);
      return unwrapData<StaffMember>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async create(payload: CreateStaffDTO) {
    try {
      const response = await http.post(`${API_V1}/staff`, payload);
      return unwrapData<StaffMember>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }

  async update(staffId: string, payload: UpdateStaffDTO) {
    try {
      const response = await http.patch(`${API_V1}/staff/${staffId}`, payload);
      return unwrapData<StaffMember>(response.data);
    } catch (err) {
      this.handleError(err);
    }
  }
}

const staffService = new StaffService();
export default staffService;
