import { get, post } from '../client/request'
import type { AdminOrderListResponse } from '@/types'

export const adminOrdersApi = {
  listAll(page = 1, limit = 50, order_status?: string): Promise<AdminOrderListResponse> {
    const statusParam = order_status ? `&order_status=${encodeURIComponent(order_status)}` : ''
    return get<AdminOrderListResponse>(`/admin/list/orders?page=${page}&limit=${limit}${statusParam}`)
  },

  listByUserType(
    user_type: 'Firmenkunde' | 'Privatkunde',
    page = 1,
    limit = 50,
    order_status?: string,
  ): Promise<AdminOrderListResponse> {
    const statusParam = order_status ? `&order_status=${encodeURIComponent(order_status)}` : ''
    return get<AdminOrderListResponse>(
      `/admin/list/orders/by-user-type?user_type=${encodeURIComponent(user_type)}&page=${page}&limit=${limit}${statusParam}`,
    )
  },

  listByUser(userId: string, page = 1, limit = 10): Promise<AdminOrderListResponse> {
    return get<AdminOrderListResponse>(
      `/admin/list/orders/user/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`,
    )
  },

  approveOrder(
    provider: "tuvsud" | "dekra",
    orderId: string,
  ): Promise<unknown> {
    return post(`/order/${provider}/order/approve/${orderId}`);
  },
  
  updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<unknown> {
    return post(`/admin/order/${encodeURIComponent(orderId)}/status`, { status });
  },

  confirmOrder(
    provider: "tuvsud" | "dekra",
    orderId: string,
    confirmationDate?: string,
  ): Promise<unknown> {
    return post(`/order/${provider}/order/confirm/${orderId}`, confirmationDate ? { confirmationDate } : {});
  },
}
