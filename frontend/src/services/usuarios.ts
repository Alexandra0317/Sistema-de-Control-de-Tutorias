import { apiRequest } from '@/services/api'
import type {
  CreateUsuarioPayload,
  RolesListResponse,
  UpdateUsuarioPayload,
  UsuarioResponse,
  UsuariosListResponse,
} from '@/types/usuarios'

export function fetchUsuarios(token: string) {
  return apiRequest<UsuariosListResponse>('/usuarios', { token })
}

export function fetchRoles(token: string) {
  return apiRequest<RolesListResponse>('/usuarios/roles', { token })
}

export function createUsuario(token: string, payload: CreateUsuarioPayload) {
  return apiRequest<UsuarioResponse>('/usuarios', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateUsuario(token: string, id: number, payload: UpdateUsuarioPayload) {
  return apiRequest<UsuarioResponse>(`/usuarios/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function updateUsuarioPassword(token: string, id: number, password: string) {
  return apiRequest<UsuarioResponse>(`/usuarios/${id}/password`, {
    method: 'PATCH',
    token,
    body: { password },
  })
}
