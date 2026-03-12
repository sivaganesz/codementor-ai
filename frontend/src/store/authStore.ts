import { create } from 'zustand'

interface AuthUser { id: string; email: string }
interface AuthStore {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('access_token', token)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    set({ token: null, user: null })
  },
  isAuthenticated: () => !!get().token,
}))
