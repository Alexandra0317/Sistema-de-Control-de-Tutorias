import { apiDownload, apiRequest } from '@/services/api'
import type {
  ReporteActividadResponse,
  ReporteBitacoraResponse,
  ReporteCoberturaResponse,
  ReporteFiltrosOpciones,
  ReporteFiltrosQuery,
} from '@/types/reportes'

function buildQuery(filters: ReporteFiltrosQuery = {}) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function fetchFiltrosReportes(token: string) {
  return apiRequest<ReporteFiltrosOpciones>('/reportes/filtros', { token })
}

export function fetchReporteCobertura(token: string, filters?: ReporteFiltrosQuery) {
  return apiRequest<ReporteCoberturaResponse>(`/reportes/cobertura${buildQuery(filters)}`, { token })
}

export function fetchReporteActividad(token: string, filters?: ReporteFiltrosQuery) {
  return apiRequest<ReporteActividadResponse>(`/reportes/actividad${buildQuery(filters)}`, { token })
}

export function fetchReporteBitacora(token: string, filters?: ReporteFiltrosQuery) {
  return apiRequest<ReporteBitacoraResponse>(`/reportes/bitacora${buildQuery(filters)}`, { token })
}

export function exportarReporteCobertura(token: string, filters?: ReporteFiltrosQuery) {
  return apiDownload(`/reportes/cobertura/exportar${buildQuery(filters)}`, token, 'reporte_cobertura.xlsx')
}

export function exportarReporteActividad(token: string, filters?: ReporteFiltrosQuery) {
  return apiDownload(`/reportes/actividad/exportar${buildQuery(filters)}`, token, 'reporte_actividad.xlsx')
}

export function exportarReporteBitacora(token: string, filters?: ReporteFiltrosQuery) {
  return apiDownload(`/reportes/bitacora/exportar${buildQuery(filters)}`, token, 'reporte_bitacora.xlsx')
}
