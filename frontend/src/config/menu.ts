import type { MenuItem, Permisos } from '@/types/auth'

export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Inicio',
    route: '/dashboard',
    recurso: 'dashboard',
    accion: 'leer',
  },
  {
    label: 'Usuarios',
    route: '/usuarios',
    recurso: 'usuarios',
    accion: 'leer',
  },
  {
    label: 'Tutorías',
    route: '/tutorias',
    recurso: 'tutorias',
    accion: 'leer',
  },
  {
    label: 'Estudiantes',
    route: '/estudiantes',
    recurso: 'estudiantes',
    accion: 'leer',
  },
  {
    label: 'Reportes',
    route: '/reportes',
    recurso: 'reportes',
    accion: 'leer',
  },
]

export function tienePermiso(permisos: Permisos, recurso: string, accion: string): boolean {
  if (recurso === 'dashboard') return true
  const acciones = permisos[recurso]
  return Array.isArray(acciones) && acciones.includes(accion)
}

export function obtenerMenuPorPermisos(permisos: Permisos): MenuItem[] {
  return MENU_ITEMS.filter((item) => tienePermiso(permisos, item.recurso, item.accion))
}
