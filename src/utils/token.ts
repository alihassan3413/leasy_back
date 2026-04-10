/**
 * Returns true if the given Unix timestamp (seconds) is in the past.
 * We subtract 30 seconds as a safety buffer to account for clock skew
 * and network round-trip time before the server rejects the token.
 */
export function isTokenExpired(expiresAt: number): boolean {
  const SAFETY_BUFFER_SECONDS = 30
  return Date.now() / 1000 >= expiresAt - SAFETY_BUFFER_SECONDS
}

/**
 * Decodes a JWT payload without verifying the signature.
 * Only use this for reading non-sensitive claims on the client
 * (e.g. expiry, role). Actual verification happens server-side.
 */
export function decodeTokenPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as T
  } catch {
    return null
  }
}
