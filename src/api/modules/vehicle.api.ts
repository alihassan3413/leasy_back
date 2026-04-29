import { get, post } from '../client/request'
import type { VehicleStatusResponse, CreateVehiclePayload } from '@/types'

export const vehicleApi = {
  getVehicleStatus(ownerId: string): Promise<VehicleStatusResponse[]> {
    return get<VehicleStatusResponse[]>(`/vehicle/list/status/${ownerId}`)
  },

  createVehicle(payload: CreateVehiclePayload): Promise<any> {
    return post<any, CreateVehiclePayload>('/vehicle/create', payload)
  },
}
