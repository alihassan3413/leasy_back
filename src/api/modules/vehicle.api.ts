import { get, post, put, patch, del } from "../client/request";
import type {
  VehicleStatusResponse,
  CreateVehiclePayload,
  Station,
  CreateOrderPayload,
  CreateOrderResponse,
  VehicleDocument,
} from "@/types";

export const vehicleApi = {
  getVehicleStatus(): Promise<VehicleStatusResponse[]> {
    return get<VehicleStatusResponse[]>(`/vehicle/list/report/status`);
  },

  getB2BVehicleStatus(): Promise<VehicleStatusResponse[]> {
    return get<VehicleStatusResponse[]>(`/vehicle/list/report/status`);
  },

  getVehicle(vehicleId: string): Promise<VehicleStatusResponse> {
    return get<VehicleStatusResponse>(`/vehicle/${vehicleId}`);
  },

  createVehicle(payload: CreateVehiclePayload): Promise<any> {
    return post<any, CreateVehiclePayload>("/vehicle/create", payload);
  },

  // PATCH /vehicle/{vehicle_id} — update editable vehicle details
  updateVehicle(vehicleId: string, payload: Partial<CreateVehiclePayload>): Promise<any> {
    return patch<any, Partial<CreateVehiclePayload>>(`/vehicle/${vehicleId}`, payload);
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

  async uploadVehicleDocument(vehicleId: string, body: FormData): Promise<VehicleDocument> {
    const resp = await put<any>(`/vehicle/${vehicleId}/documents`, body, {
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

  deleteVehicleDocument(vehicleId: string, documentId: string): Promise<any> {
    return del<any>(`/vehicle/${vehicleId}/documents/${documentId}`);
  },

  getStations(provider: "tuvsud" | "dekra"): Promise<Station[]> {
    return get<Station[]>(`/order/stations/${provider}`);
  },

  // Returns every station across all providers; each station carries its own
  // `provider` field, so the caller no longer selects tuvsud/dekra up front.
  getAllStations(): Promise<Station[]> {
    return get<Station[]>(`/order/stations`);
  },

  createStation(payload: {
    provider: "tuvsud" | "dekra";
    name: string;
    strasse: string;
    plz: string;
    ort: string;
    bundesland: string;
  }): Promise<Station> {
    return post<Station, any>("/order/stations/create", payload);
  },

  createOrder(
    provider: "tuvsud" | "dekra",
    vehicleId: string,
    payload: CreateOrderPayload,
    userId?: string,
  ): Promise<CreateOrderResponse> {
    const urlProvider = provider === "dekra" ? "others" : provider;
    let url = `/order/${urlProvider}/create/${vehicleId}`;
    return post<CreateOrderResponse, CreateOrderPayload>(url, payload);
  },
};
