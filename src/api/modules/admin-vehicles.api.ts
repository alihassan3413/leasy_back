import { get, post, patch } from "../client/request";
import type { AdminVehicleListResponse, VehicleDocument } from "@/types";

export const adminVehiclesApi = {
  listAll(page = 1, limit = 20): Promise<AdminVehicleListResponse> {
    return get<AdminVehicleListResponse>(`/admin/list/vehicles?page=${page}&limit=${limit}`);
  },

  listByUserType(
    user_type: "Firmenkunde" | "Privatkunde",
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<AdminVehicleListResponse> {
    const statusParam = status ? `&status=${encodeURIComponent(status)}` : "";
    return get<AdminVehicleListResponse>(
      `/admin/list/vehicles/by-user-type?user_type=${encodeURIComponent(user_type)}&page=${page}&limit=${limit}${statusParam}`,
    );
  },

  listByUser(
    userId: string,
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<AdminVehicleListResponse> {
    const statusParam = status ? `?status=${encodeURIComponent(status)}` : "";
    return get<AdminVehicleListResponse>(
      `/admin/list/vehicles/user/${encodeURIComponent(userId)}?page=${page}&limit=${limit}${statusParam}`,
    );
  },

  async uploadReport(
    auftragsnummer: string,
    vehicleId: string,
    documentType: string,
    documentTitle: string,
    file: File,
    published: boolean = false,
  ): Promise<VehicleDocument> {
    const formData = new FormData();
    formData.append("auftragsnummer", auftragsnummer);
    formData.append("vehicle_id", vehicleId);
    formData.append("document_type", documentType);
    formData.append("document_title", documentTitle);
    formData.append("published", published.toString());
    formData.append("file", file);

    const resp = await post<any>("/admin/vehicle/report/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      id: resp?.document_id ?? resp?.id,
      document_type: resp?.document_type ?? resp?.documentType,
      file_name: resp?.original_file_name ?? resp?.file_name ?? resp?.originalFileName,
      created_at: resp?.created_at ?? resp?.uploaded_at ?? resp?.createdAt,
      url: resp?.signed_url ?? resp?.url ?? resp?.signedUrl,
    };
  },

  publishReport(documentId: string, published: boolean = true): Promise<unknown> {
    return patch(`/admin/vehicle/report/publish/${encodeURIComponent(documentId)}`, {
      published,
    });
  },
};
