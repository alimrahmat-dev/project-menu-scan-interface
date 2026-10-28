import { useCallback, useEffect, useMemo, useState } from 'react'
import { ADMIN_TOKEN_KEY, api } from '../lib/api'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(ADMIN_TOKEN_KEY)))

  useEffect(() => {
    let active = true

    if (!token) {
      return () => {
        active = false
      }
    }

    api
      .get('/admin/me')
      .then(({ data }) => {
        if (active) setUser(data.user)
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(ADMIN_TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      setToken(null)
      setUser(null)
      setLoading(false)
    }

    window.addEventListener('rn:unauthorized', handleUnauthorized)

    return () => window.removeEventListener('rn:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/admin/login', {
      email,
      password,
      device_name: 'web-admin',
    })

    localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)

    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/logout')
    } catch {
      // Token mungkin sudah tidak valid; tetap bersihkan sesi lokal.
    }

    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
