export interface Permisos {
  [recurso: string]: string[]
}

export interface Rol {
  id: number
  nombre: string
  descripcion: string
  permisos: Permisos
}

export interface Usuario {
  id: number
  correo: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  telefono: string | null
  status: string
  rol: Rol | null
}

export interface LoginResponse {
  token: string
  user: Usuario
}

export interface MenuItem {
  label: string
  route: string
  icon?: string
  recurso: string
  accion: string
}
