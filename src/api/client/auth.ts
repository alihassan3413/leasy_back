export type TokenGetter = () => string | null
export type TokenRefresher = () => Promise<string>
export type AuthFailureHandler = () => void

let getAccessToken: TokenGetter = () => null
let refreshAccessToken: TokenRefresher = () =>
  Promise.reject(new Error('Auth not configured'))
let onAuthFailure: AuthFailureHandler = () => {}

export function configureClientAuth(opts: {
  getAccessToken: TokenGetter
  refreshAccessToken: TokenRefresher
  onAuthFailure: AuthFailureHandler
}) {
  getAccessToken = opts.getAccessToken
  refreshAccessToken = opts.refreshAccessToken
  onAuthFailure = opts.onAuthFailure
}

export function authConfig() {
  return {
    getAccessToken,
    refreshAccessToken,
    onAuthFailure,
  }
}