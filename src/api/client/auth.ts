export type TokenGetter = () => string | null
export type TokenRefresher = () => Promise<string>
export type AuthFailureHandler = () => void

let getAccessToken: TokenGetter = () => null
let onAuthFailure: AuthFailureHandler = () => {}

export function configureClientAuth(opts: {
  getAccessToken: TokenGetter
  onAuthFailure: AuthFailureHandler
}) {
  getAccessToken = opts.getAccessToken
  onAuthFailure = opts.onAuthFailure
}

export function authConfig() {
  return {
    getAccessToken,
    onAuthFailure,
  }
}