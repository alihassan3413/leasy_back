import type { AxiosRequestConfig } from 'axios'
import http from './http'

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await http.get<T>(url, config)
  return response.data
}

export async function post<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await http.post<TResponse>(url, body, config)
  return response.data
}

export async function put<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await http.put<TResponse>(url, body, config)
  return response.data
}

export async function patch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await http.patch<TResponse>(url, body, config)
  return response.data
}

export async function del<TResponse>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await http.delete<TResponse>(url, config)
  return response.data
}