import { defineStore } from 'pinia'
import { normalizeApiError } from '@/api/client/error'
import type { WorkshopCreatePayload, WorkshopCreateResponse } from '@/types'
import { workshopApi } from '@/api/workshop/workshop'
import { ref } from 'vue'

type Status = 'idle' | 'loading' | 'success' | 'error'

export const useWorkshopStore = defineStore('workshop', () => {
  const status = ref<Status>('idle')
  const error = ref('')
  const profile = ref<WorkshopCreateResponse | null>(null)

  async function create(payload: WorkshopCreatePayload) {
    status.value = 'loading'
    error.value = ''

    try {
      const res = await workshopApi.create(payload)
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
