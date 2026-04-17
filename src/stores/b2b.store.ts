import { defineStore } from 'pinia'
import { normalizeApiError } from '@/api/client/error'
import type { B2BCreateComapnyPayload, B2BCreateResponse } from '@/types'
import { b2bApi } from '@/api/b2b/b2b'

type Status = 'idle' | 'loading' | 'success' | 'error'

export const useB2BStore = defineStore('b2b', () => {
  const status = ref<Status>('idle')
  const error = ref('')
  const profile = ref<B2BCreateResponse | null>(null)

  async function create(payload: B2BCreateComapnyPayload) {
    status.value = 'loading'
    error.value = ''

    try {
      const res = await b2bApi.create(payload)
      profile.value = res
      status.value = 'success'
      return res
    } catch (err) {
      const apiError = normalizeApiError(err)
      error.value = apiError.message
      status.value = 'error'
      throw err
    }
  }

  return {
    status,
    error,
    profile,
    create,
  }
})