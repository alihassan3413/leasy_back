import { get, post } from "../client/request";
import type {
  VehicleStatusResponse,
  CreateVehiclePayload,
  Station,
  CreateOrderPayload,
  CreateOrderResponse,
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

  getStations(provider: "tuvsud" | "dekra"): Promise<Station[]> {
    return get<Station[]>(`/order/stations/${provider}`);
  },

  createOrder(
    provider: "tuvsud" | "dekra",
    vehicleId: string,
    payload: CreateOrderPayload,
  ): Promise<CreateOrderResponse> {
    return post<CreateOrderResponse, CreateOrderPayload>(
      `/order/${provider}/create/${vehicleId}`,
      payload,
    );
  },
};
