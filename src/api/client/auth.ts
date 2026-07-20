export type TokenGetter = () => string | null;
export type TokenRefresher = () => Promise<string>;
export type AuthFailureHandler = () => void;
export type LoggingOutGetter = () => boolean;

let getAccessToken: TokenGetter = () => null;
let onAuthFailure: AuthFailureHandler = () => {};
let isLoggingOut: LoggingOutGetter = () => false;

export function configureClientAuth(opts: {
  getAccessToken: TokenGetter;
  onAuthFailure: AuthFailureHandler;
  isLoggingOut: LoggingOutGetter;
}) {
  getAccessToken = opts.getAccessToken;
  onAuthFailure = opts.onAuthFailure;
  isLoggingOut = opts.isLoggingOut;
}

export function authConfig() {
  return {
    getAccessToken,
    onAuthFailure,
    isLoggingOut,
  };
}
