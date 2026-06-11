import { get, post, put, del } from "../client/request";
import type {
  VehicleStatusResponse,
  CreateVehiclePayload,
  Station,
  CreateOrderPayload,
  CreateOrderResponse,
  VehicleDocument,
} from "@/types";

export const vehicleApi = {
  getVehicleStatus(ownerId: string): Promise<VehicleStatusResponse[]> {
    return get<VehicleStatusResponse[]>(`/vehicle/list/status/${ownerId}`);
  },

  getB2BVehicleStatus(ownerId: string): Promise<VehicleStatusResponse[]> {
    return get<VehicleStatusResponse[]>(`/vehicle/list/status/${ownerId}`);
  },

  createVehicle(payload: CreateVehiclePayload): Promise<any> {
    return post<any, CreateVehiclePayload>("/vehicle/create", payload);
  },

  async getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
    const resp = await get<any[]>(`/vehicle/${vehicleId}/documents`);

    return (resp || []).map((r) => ({
      id: r.document_id ?? r.id,
      document_type: r.document_type ?? r.documentType ?? r.type,
      file_name: r.original_file_name ?? r.file_name ?? r.fileName,
      created_at: r.created_at ?? r.uploaded_at ?? r.createdAt,
      url: r.signed_url ?? r.url ?? r.signedUrl,
    }));
  },

  async uploadVehicleDocument(
    vehicleId: string,
    body: FormData,
  ): Promise<VehicleDocument> {
    const resp = await put<any>(`/vehicle/${vehicleId}/documents`, body, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      id: resp?.document_id ?? resp?.id,
      document_type: resp?.document_type ?? resp?.documentType,
      file_name:
        resp?.original_file_name ?? resp?.file_name ?? resp?.originalFileName,
      created_at: resp?.created_at ?? resp?.uploaded_at ?? resp?.createdAt,
      url: resp?.signed_url ?? resp?.url ?? resp?.signedUrl,
    };
  },

  deleteVehicleDocument(vehicleId: string, documentId: string): Promise<any> {
    return del<any>(`/vehicle/${vehicleId}/documents/${documentId}`);
  },

  getStations(provider: "tuvsud" | "dekra"): Promise<Station[]> {
    return get<Station[]>(`/order/stations/${provider}`);
  },

  createOrder(
    provider: "tuvsud" | "dekra",
    vehicleId: string,
    payload: CreateOrderPayload,
    userId?: string,
  ): Promise<CreateOrderResponse> {
    let url = `/order/${provider}/create/${vehicleId}`;
    if (userId) {
      url += `/${userId}`;
    }
    return post<CreateOrderResponse, CreateOrderPayload>(url, payload);
  },
};
