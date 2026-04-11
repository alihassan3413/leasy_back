import axios from 'axios'

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export function normalizeApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message: 'Something went wrong. Please try again.',
    }
  }

  const status = error.response?.status
  const data = error.response?.data as
    | {
        message?: string
        errors?: Record<string, string[]>
      }
    | undefined

  return {
    status,
    message: data?.message || error.message || 'Request failed.',
    errors: data?.errors,
  }
}