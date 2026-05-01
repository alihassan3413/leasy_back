import { defineStore } from 'pinia'
import { ref } from 'vue'
import { b2cApi } from '@/api'
import { normalizeApiError } from '@/api/client/error'
import type { B2CUserProfileResponse } from '@/types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export const useB2CStore = defineStore('b2c', () => {
  const status = ref<Status>('idle')
  const error = ref('')
  const profile = ref<B2CUserProfileResponse | null>(null)

  async function fetchProfile() {
    status.value = 'loading'
    error.value = ''

    try {
      const res = await b2cApi.getProfile()
      // Handle wrapped response if necessary (following workshop pattern)
      if (res && (res as any).ok && (res as any).data) {
        profile.value = (res as any).data
      } else {
        profile.value = res
      }

      status.value = 'success'
      return profile.value
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
    fetchProfile,
  }
})
