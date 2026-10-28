import axios from 'axios'

export const ADMIN_TOKEN_KEY = 'rn_admin_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''

    if (error.response?.status === 401 && url.includes('/admin')) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      window.dispatchEvent(new Event('rn:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  const data = error?.response?.data

  if (data?.errors && typeof data.errors === 'object') {
    const firstError = Object.values(data.errors)[0]

    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0]
    }
  }

  return data?.message || error?.message || fallback
}
