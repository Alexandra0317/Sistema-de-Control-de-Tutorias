export interface TutorBrief {
  id: number
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  correo: string
}

export interface Estudiante {
  id: number
  matricula: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  semestres: number
  carrera: string
  grupo: string
  tutor_actual: TutorBrief | null
  asignacion_activa_id: number | null
  historial_tutores?: AsignacionTutor[]
}

export interface AsignacionTutor {
  id: number
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  tutor: TutorBrief | null
  observaciones?: Observacion[]
}

export interface Observacion {
  id: number
  asignacion_id: number
  contenido: string
  fecha: string
  tutor?: TutorBrief
}

export interface CreateEstudiantePayload {
  matricula: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  semestres: number
  carrera: string
  grupo: string
  tutor_id?: number
}

export interface UpdateEstudiantePayload {
  matricula?: string
  nombre?: string
  apellido_paterno?: string
  apellido_materno?: string
  semestres?: number
  carrera?: string
  grupo?: string
}

export interface EstudiantesListResponse {
  students: Estudiante[]
}

export interface EstudianteResponse {
  student: Estudiante
}

export interface TutoresListResponse {
  tutores: TutorBrief[]
}

export interface ObservacionesListResponse {
  observaciones: Observacion[]
}

export interface ObservacionResponse {
  observacion: Observacion
}

export interface HistorialTutoresResponse {
  historial: AsignacionTutor[]
}

export interface CargaMasivaError {
  fila: number
  matricula: string | null
  mensaje: string
}

export interface CargaMasivaResponse {
  total: number
  creados: number
  errores: CargaMasivaError[]
  students: Estudiante[]
}
