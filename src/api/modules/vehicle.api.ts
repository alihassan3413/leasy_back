import { get } from '../client/request'
import type { VehicleStatusResponse } from '@/types'

export const vehicleApi = {
  getVehicleStatus(ownerId: string): Promise<VehicleStatusResponse[]> {
    return get<VehicleStatusResponse[]>(`/vehicle/list/status/${ownerId}`)
  },
}
