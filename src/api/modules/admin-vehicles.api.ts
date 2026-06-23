import { get } from '../client/request'
import type { AdminVehicleListResponse } from '@/types'

export const adminVehiclesApi = {
  listAll(page = 1, limit = 20): Promise<AdminVehicleListResponse> {
    return get<AdminVehicleListResponse>(`/admin/list/vehicles?page=${page}&limit=${limit}`)
  },

  listByUserType(
    user_type: 'Firmenkunde' | 'Privatkunde',
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<AdminVehicleListResponse> {
    const statusParam = status ? `&status=${encodeURIComponent(status)}` : ''
    return get<AdminVehicleListResponse>(
      `/admin/list/vehicles/by-user-type?user_type=${encodeURIComponent(user_type)}&page=${page}&limit=${limit}${statusParam}`,
    )
  },

  listByUser(userId: string, page = 1, limit = 10, status?: string): Promise<AdminVehicleListResponse> {
    const statusParam = status ? `?status=${encodeURIComponent(status)}` : ''
    return get<AdminVehicleListResponse>(`/admin/list/vehicles/user/${encodeURIComponent(userId)}?page=${page}&limit=${limit}${statusParam}`)
  },
}
