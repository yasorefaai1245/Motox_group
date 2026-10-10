import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './AuthState.js'
import api from '../services/api.js'

async function getSessionUser() {
  const { data, status } = await api.get('/api/user', {
    validateStatus: (responseStatus) =>
      (responseStatus >= 200 && responseStatus < 300) || responseStatus === 401,
  })

  return status === 401 ? null : data
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true, error: '' })

  const refreshUser = useCallback(async () => {
    try {
      const user = await getSessionUser()
      setState({ user, loading: false, error: '' })
      return user
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.response?.data?.message || 'Could not verify your account session.',
      }))
      throw error
    }
  }, [])

  useEffect(() => {
    let current = true
    getSessionUser()
      .then((user) => {
        if (current) setState({ user, loading: false, error: '' })
      })
      .catch((error) => {
        if (!current) return
        setState({
          user: null,
          loading: false,
          error: error.response?.data?.message || 'Could not verify your account session.',
        })
      })
    return () => {
      current = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    await api.get('/sanctum/csrf-cookie')
    const { data } = await api.post('/api/login', credentials)
    setState({ user: data.user, loading: false, error: '' })
    return data.user
  }, [])

  const register = useCallback(async (details) => {
    await api.get('/sanctum/csrf-cookie')
    const { data } = await api.post('/api/register', details)
    setState({ user: data.user, loading: false, error: '' })
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.post('/api/logout')
    setState({ user: null, loading: false, error: '' })
  }, [])

  const value = useMemo(
    () => ({ ...state, login, register, logout, refreshUser }),
    [state, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
