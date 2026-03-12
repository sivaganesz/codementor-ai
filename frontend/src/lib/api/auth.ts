import { apiClient } from './client'

export interface LoginDto {
  email: string
  password?: string
}

export interface RegisterDto {
  email: string
  password?: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
  }
}

export const authApi = {
  login: (payload: LoginDto) =>
    apiClient.post<AuthResponse>('/auth/login', payload),

  register: (payload: RegisterDto) =>
    apiClient.post<AuthResponse>('/auth/register', payload),
}
