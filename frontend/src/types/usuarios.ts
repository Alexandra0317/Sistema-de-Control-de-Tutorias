import type { Usuario } from '@/types/auth'

export interface RolOption {
  id: number
  nombre: string
  descripcion: string
}

export interface UpdateUsuarioPayload {
  telefono?: string
  status?: string
  password?: string
}

export interface CreateUsuarioPayload {
  correo: string
  password: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  telefono?: string
  role_id: number
  status?: string
}

export interface UsuariosListResponse {
  users: Usuario[]
}

export interface UsuarioResponse {
  user: Usuario
}

export interface RolesListResponse {
  roles: RolOption[]
}
