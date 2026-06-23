import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig<D = any> {
    skipAuth?: boolean
  }

  export interface InternalAxiosRequestConfig<D = any> {
    _retried?: boolean
    skipAuth?: boolean
  }
}