import type { AuthResponse, User, UserRole } from '@/types'

const userTypeMap: Record<string, UserRole> = {
  Privatkunde: 'B2C',
  Firmenkunde: 'B2B',
  Werkstatt:   'WORKSHOP',
  Admin:       'ADMIN',
}

export function mapLoginResponse(raw: any, userEmail: string): AuthResponse {
  return {
    user: {
      id:    raw.data.user_id,
      email: userEmail,
      role:  userTypeMap[raw.data.user_type] ?? 'B2C',
    } as User,
    tokens: {
      accessToken:  raw.data.token,
    },
  }
}