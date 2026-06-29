import type { AsignacionTutor, Estudiante, Observacion, TutorBrief } from '@/types/estudiantes'

export interface ReporteFiltrosOpciones {
  carreras: string[]
  grupos: string[]
  semestres: number[]
  tutores: TutorBrief[]
}

export interface ReporteCoberturaResumen {
  total_alumnos: number
  con_tutor: number
  sin_tutor: number
}

export interface ReporteCoberturaPorTutor {
  tutor: TutorBrief
  total_alumnos: number
  alumnos: Estudiante[]
}

export interface ReporteCoberturaPorCarrera {
  carrera: string
  total: number
  con_tutor: number
  sin_tutor: number
}

export interface ReporteCoberturaPorGrupo {
  carrera: string
  grupo: string
  total: number
  con_tutor: number
  sin_tutor: number
}

export interface ReporteCobertura {
  filtros: Record<string, string | undefined>
  resumen: ReporteCoberturaResumen
  por_tutor: ReporteCoberturaPorTutor[]
  por_carrera: ReporteCoberturaPorCarrera[]
  por_grupo: ReporteCoberturaPorGrupo[]
  alumnos_sin_tutor: Estudiante[]
}

export interface ReporteActividadPorTutor {
  tutor: TutorBrief
  total_observaciones: number
  alumnos_asignados: number
  alumnos_con_observaciones: number
  alumnos_sin_observaciones: number
  promedio_por_alumno: number
}

export interface AlumnoSinSeguimiento {
  alumno: Estudiante
  tutor: TutorBrief
}

export interface ReporteActividad {
  periodo: { desde: string; hasta: string }
  filtros: { tutor_id: number | null }
  por_tutor: ReporteActividadPorTutor[]
  alumnos_sin_seguimiento: AlumnoSinSeguimiento[]
}

export interface BitacoraAlumno {
  alumno: Estudiante
  historial_tutores: AsignacionTutor[]
  observaciones: Observacion[]
}

export interface ReporteBitacora {
  filtros: {
    matricula: string | null
    carrera: string | null
    grupo: string | null
    semestre: number | null
    fecha_desde: string | null
    fecha_hasta: string | null
  }
  total: number
  alumnos: BitacoraAlumno[]
}

export interface ReporteFiltrosQuery {
  carrera?: string
  grupo?: string
  semestre?: number
  tutor_id?: number
  fecha_desde?: string
  fecha_hasta?: string
  matricula?: string
}

export interface ReporteCoberturaResponse {
  report: ReporteCobertura
}

export interface ReporteActividadResponse {
  report: ReporteActividad
}

export interface ReporteBitacoraResponse {
  report: ReporteBitacora
}
