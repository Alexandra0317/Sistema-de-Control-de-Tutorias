import { apiRequest } from '@/services/api'
import type {
  CreateEstudiantePayload,
  EstudianteResponse,
  EstudiantesListResponse,
  HistorialTutoresResponse,
  ObservacionResponse,
  ObservacionesListResponse,
  TutoresListResponse,
  UpdateEstudiantePayload,
} from '@/types/estudiantes'

export function fetchEstudiantes(token: string) {
  return apiRequest<EstudiantesListResponse>('/estudiantes', { token })
}

export function fetchEstudiante(token: string, id: number) {
  return apiRequest<EstudianteResponse>(`/estudiantes/${id}`, { token })
}

export function fetchTutores(token: string) {
  return apiRequest<TutoresListResponse>('/estudiantes/tutores', { token })
}

export function createEstudiante(token: string, payload: CreateEstudiantePayload) {
  return apiRequest<EstudianteResponse>('/estudiantes', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateEstudiante(token: string, id: number, payload: UpdateEstudiantePayload) {
  return apiRequest<EstudianteResponse>(`/estudiantes/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function deleteEstudiante(token: string, id: number) {
  return apiRequest<{ message: string }>(`/estudiantes/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function changeTutor(token: string, id: number, tutor_id: number) {
  return apiRequest<EstudianteResponse>(`/estudiantes/${id}/tutor`, {
    method: 'PATCH',
    token,
    body: { tutor_id },
  })
}

export function fetchHistorialTutores(token: string, id: number) {
  return apiRequest<HistorialTutoresResponse>(`/estudiantes/${id}/historial-tutores`, { token })
}

export function fetchObservaciones(token: string, id: number) {
  return apiRequest<ObservacionesListResponse>(`/estudiantes/${id}/observaciones`, { token })
}

export function createObservacion(token: string, id: number, contenido: string, fecha?: string) {
  return apiRequest<ObservacionResponse>(`/estudiantes/${id}/observaciones`, {
    method: 'POST',
    token,
    body: { contenido, fecha },
  })
}
