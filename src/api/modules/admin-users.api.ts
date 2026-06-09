import { get } from '../client/request'
import type { AdminUserListResponse } from '@/types'

export const adminUsersApi = {
  getB2c(page = 1, limit = 10): Promise<AdminUserListResponse> {
    return get<AdminUserListResponse>(`/admin/users/b2c?page=${page}&limit=${limit}`)
  },

  getB2b(page = 1, limit = 10): Promise<AdminUserListResponse> {
    return get<AdminUserListResponse>(`/admin/users/b2b?page=${page}&limit=${limit}`)
  },
}
