import { post } from '../client/request'
import type { B2CProfileCreatePayload, B2CProfileCreateResponse } from '@/types'

export const b2cApi = {
  createProfile(payload: B2CProfileCreatePayload): Promise<B2CProfileCreateResponse> {
    return post<B2CProfileCreateResponse, B2CProfileCreatePayload>(
      '/userprofile/address-contact',
      payload,
    )
  },
}
