import { apiRequest } from './api'
import type { LoginResponse, Usuario } from '@/types/auth'

export async function login(correo: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { correo, password },
  })
}

export async function fetchCurrentUser(token: string): Promise<Usuario> {
  const data = await apiRequest<{ user: Usuario }>('/auth/me', {
    method: 'GET',
    token,
  })
  return data.user
}
