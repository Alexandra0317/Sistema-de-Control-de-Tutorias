<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tienePermiso } from '@/config/menu'
import * as reportesService from '@/services/reportes'
import type {
  ReporteActividad,
  ReporteBitacora,
  ReporteCobertura,
  ReporteFiltrosOpciones,
  ReporteFiltrosQuery,
} from '@/types/reportes'

const auth = useAuthStore()

type TabId = 'cobertura' | 'actividad' | 'bitacora'

const esAdmin = computed(() => auth.rolNombre === 'administrador')
const puedeExportar = computed(() => tienePermiso(auth.permisos, 'reportes', 'exportar'))

const tabActiva = ref<TabId>(esAdmin.value ? 'cobertura' : 'bitacora')

const opciones = ref<ReporteFiltrosOpciones>({
  carreras: [],
  grupos: [],
  semestres: [],
  tutores: [],
})

const loading = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)

const reporteCobertura = ref<ReporteCobertura | null>(null)
const reporteActividad = ref<ReporteActividad | null>(null)
const reporteBitacora = ref<ReporteBitacora | null>(null)

const filtroCarrera = ref('')
const filtroGrupo = ref('')
const filtroSemestre = ref<number | ''>('')
const filtroTutor = ref<number | ''>('')
const filtroMatricula = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')

const tabs = computed(() => {
  const items: { id: TabId; label: string }[] = []
  if (esAdmin.value) {
    items.push({ id: 'cobertura', label: 'Cobertura y asignación' })
    items.push({ id: 'actividad', label: 'Actividad de seguimiento' })
  }
  items.push({ id: 'bitacora', label: 'Bitácora del alumno' })
  return items
})

function nombreCompleto(item: { nombre: string; apellido_paterno: string; apellido_materno?: string | null }) {
  return [item.nombre, item.apellido_paterno, item.apellido_materno].filter(Boolean).join(' ')
}

function inicioMesActual() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function buildFiltrosBase(): ReporteFiltrosQuery {
  const filtros: ReporteFiltrosQuery = {}
  if (filtroCarrera.value) filtros.carrera = filtroCarrera.value
  if (filtroGrupo.value) filtros.grupo = filtroGrupo.value
  if (filtroSemestre.value !== '') filtros.semestre = Number(filtroSemestre.value)
  return filtros
}

function buildFiltrosActividad(): ReporteFiltrosQuery {
  return {
    ...buildFiltrosBase(),
    tutor_id: filtroTutor.value !== '' ? Number(filtroTutor.value) : undefined,
    fecha_desde: filtroFechaDesde.value || inicioMesActual(),
    fecha_hasta: filtroFechaHasta.value || hoy(),
  }
}

function buildFiltrosBitacora(): ReporteFiltrosQuery {
  const filtros = buildFiltrosBase()
  if (filtroMatricula.value.trim()) filtros.matricula = filtroMatricula.value.trim()
  if (filtroFechaDesde.value) filtros.fecha_desde = filtroFechaDesde.value
  if (filtroFechaHasta.value) filtros.fecha_hasta = filtroFechaHasta.value
  return filtros
}

async function cargarOpciones() {
  if (!auth.token) return
  try {
    opciones.value = await reportesService.fetchFiltrosReportes(auth.token)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar filtros'
  }
}

async function generarReporte() {
  if (!auth.token) return

  loading.value = true
  error.value = null

  try {
    if (tabActiva.value === 'cobertura') {
      const { report } = await reportesService.fetchReporteCobertura(auth.token, buildFiltrosBase())
      reporteCobertura.value = report
    } else if (tabActiva.value === 'actividad') {
      const { report } = await reportesService.fetchReporteActividad(auth.token, buildFiltrosActividad())
      reporteActividad.value = report
    } else {
      if (filtroMatricula.value.trim() && filtroMatricula.value.trim().length !== 10) {
        error.value = 'La matrícula debe tener exactamente 10 caracteres'
        return
      }
      const { report } = await reportesService.fetchReporteBitacora(auth.token, buildFiltrosBitacora())
      reporteBitacora.value = report
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al generar reporte'
  } finally {
    loading.value = false
  }
}

async function exportarReporte() {
  if (!auth.token || !puedeExportar.value) return

  exporting.value = true
  error.value = null

  try {
    if (tabActiva.value === 'cobertura') {
      await reportesService.exportarReporteCobertura(auth.token, buildFiltrosBase())
    } else if (tabActiva.value === 'actividad') {
      await reportesService.exportarReporteActividad(auth.token, buildFiltrosActividad())
    } else {
      await reportesService.exportarReporteBitacora(auth.token, buildFiltrosBitacora())
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al exportar reporte'
  } finally {
    exporting.value = false
  }
}

function cambiarTab(id: TabId) {
  tabActiva.value = id
  error.value = null
}

onMounted(() => {
  filtroFechaDesde.value = inicioMesActual()
  filtroFechaHasta.value = hoy()
  cargarOpciones()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Reportes</h1>
        <p class="subtitle">
          {{ esAdmin ? 'Consulta y exporta reportes del sistema de tutorías' : 'Consulta la bitácora de seguimiento de tus alumnos' }}
        </p>
      </div>
    </header>

    <nav class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab-btn"
        :class="{ active: tabActiva === tab.id }"
        @click="cambiarTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <section class="filters-card">
      <h2>Filtros</h2>
      <div class="filters-grid">
        <div v-if="tabActiva !== 'actividad'" class="field">
          <label for="filtro-carrera">Carrera</label>
          <select id="filtro-carrera" v-model="filtroCarrera">
            <option value="">Todas</option>
            <option v-for="c in opciones.carreras" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div v-if="tabActiva !== 'actividad'" class="field">
          <label for="filtro-grupo">Grupo</label>
          <select id="filtro-grupo" v-model="filtroGrupo">
            <option value="">Todos</option>
            <option v-for="g in opciones.grupos" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <div v-if="tabActiva !== 'actividad'" class="field">
          <label for="filtro-semestre">Semestre</label>
          <select id="filtro-semestre" v-model="filtroSemestre">
            <option value="">Todos</option>
            <option v-for="s in opciones.semestres" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div v-if="tabActiva === 'actividad' && esAdmin" class="field">
          <label for="filtro-tutor">Tutor</label>
          <select id="filtro-tutor" v-model="filtroTutor">
            <option value="">Todos</option>
            <option v-for="t in opciones.tutores" :key="t.id" :value="t.id">
              {{ nombreCompleto(t) }}
            </option>
          </select>
        </div>

        <div v-if="tabActiva === 'actividad' || tabActiva === 'bitacora'" class="field">
          <label for="filtro-desde">Fecha desde</label>
          <input id="filtro-desde" v-model="filtroFechaDesde" type="date" />
        </div>

        <div v-if="tabActiva === 'actividad' || tabActiva === 'bitacora'" class="field">
          <label for="filtro-hasta">Fecha hasta</label>
          <input id="filtro-hasta" v-model="filtroFechaHasta" type="date" />
        </div>

        <div v-if="tabActiva === 'bitacora'" class="field">
          <label for="filtro-matricula">Matrícula</label>
          <input
            id="filtro-matricula"
            v-model="filtroMatricula"
            type="text"
            maxlength="10"
            placeholder="Ej. 2024001234"
          />
        </div>
      </div>

      <div class="filters-actions">
        <button type="button" class="btn-primary" :disabled="loading" @click="generarReporte">
          {{ loading ? 'Generando...' : 'Generar reporte' }}
        </button>
        <button
          v-if="puedeExportar"
          type="button"
          class="btn-secondary"
          :disabled="exporting || loading"
          @click="exportarReporte"
        >
          {{ exporting ? 'Exportando...' : 'Exportar Excel' }}
        </button>
      </div>
    </section>

    <p v-if="error" class="alert error">{{ error }}</p>

    <!-- Reporte 1: Cobertura -->
    <template v-if="tabActiva === 'cobertura' && reporteCobertura">
      <section class="summary-cards">
        <div class="summary-card">
          <span class="summary-value">{{ reporteCobertura.resumen.total_alumnos }}</span>
          <span class="summary-label">Total alumnos</span>
        </div>
        <div class="summary-card success">
          <span class="summary-value">{{ reporteCobertura.resumen.con_tutor }}</span>
          <span class="summary-label">Con tutor</span>
        </div>
        <div class="summary-card warning">
          <span class="summary-value">{{ reporteCobertura.resumen.sin_tutor }}</span>
          <span class="summary-label">Sin tutor</span>
        </div>
      </section>

      <section class="table-card">
        <h3>Alumnos por tutor</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tutor</th>
              <th>Correo</th>
              <th>Total alumnos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="reporteCobertura.por_tutor.length === 0">
              <td colspan="3" class="empty">Sin datos</td>
            </tr>
            <tr v-for="item in reporteCobertura.por_tutor" :key="item.tutor.id">
              <td class="name">{{ nombreCompleto(item.tutor) }}</td>
              <td>{{ item.tutor.correo }}</td>
              <td>{{ item.total_alumnos }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="table-card">
        <h3>Por carrera</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Carrera</th>
              <th>Total</th>
              <th>Con tutor</th>
              <th>Sin tutor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in reporteCobertura.por_carrera" :key="item.carrera">
              <td>{{ item.carrera }}</td>
              <td>{{ item.total }}</td>
              <td>{{ item.con_tutor }}</td>
              <td>{{ item.sin_tutor }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="reporteCobertura.alumnos_sin_tutor.length > 0" class="table-card">
        <h3>Alumnos sin tutor asignado</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Carrera</th>
              <th>Grupo</th>
              <th>Semestre</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alumno in reporteCobertura.alumnos_sin_tutor" :key="alumno.id">
              <td class="mono">{{ alumno.matricula }}</td>
              <td class="name">{{ nombreCompleto(alumno) }}</td>
              <td>{{ alumno.carrera }}</td>
              <td>{{ alumno.grupo }}</td>
              <td>{{ alumno.semestres }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <!-- Reporte 2: Actividad -->
    <template v-if="tabActiva === 'actividad' && reporteActividad">
      <p class="period-label">
        Periodo: <strong>{{ reporteActividad.periodo.desde }}</strong> a
        <strong>{{ reporteActividad.periodo.hasta }}</strong>
      </p>

      <section class="table-card">
        <h3>Actividad por tutor</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tutor</th>
              <th>Observaciones</th>
              <th>Alumnos asignados</th>
              <th>Con seguimiento</th>
              <th>Sin seguimiento</th>
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="reporteActividad.por_tutor.length === 0">
              <td colspan="6" class="empty">Sin datos en el periodo</td>
            </tr>
            <tr v-for="item in reporteActividad.por_tutor" :key="item.tutor.id">
              <td class="name">{{ nombreCompleto(item.tutor) }}</td>
              <td>{{ item.total_observaciones }}</td>
              <td>{{ item.alumnos_asignados }}</td>
              <td>{{ item.alumnos_con_observaciones }}</td>
              <td>{{ item.alumnos_sin_observaciones }}</td>
              <td>{{ item.promedio_por_alumno }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="reporteActividad.alumnos_sin_seguimiento.length > 0" class="table-card">
        <h3>Alumnos sin observaciones en el periodo</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Carrera</th>
              <th>Grupo</th>
              <th>Tutor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in reporteActividad.alumnos_sin_seguimiento" :key="item.alumno.id">
              <td class="mono">{{ item.alumno.matricula }}</td>
              <td class="name">{{ nombreCompleto(item.alumno) }}</td>
              <td>{{ item.alumno.carrera }}</td>
              <td>{{ item.alumno.grupo }}</td>
              <td>{{ nombreCompleto(item.tutor) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <!-- Reporte 3: Bitácora -->
    <template v-if="tabActiva === 'bitacora' && reporteBitacora">
      <p class="period-label">
        {{ reporteBitacora.total }} alumno(s) encontrado(s)
      </p>

      <p v-if="reporteBitacora.total === 0" class="empty-state">
        No hay alumnos que coincidan con los filtros seleccionados.
      </p>

      <article
        v-for="entry in reporteBitacora.alumnos"
        :key="entry.alumno.id"
        class="bitacora-card"
      >
        <header class="bitacora-header">
          <div>
            <h3>{{ nombreCompleto(entry.alumno) }}</h3>
            <p class="bitacora-meta">
              <span class="mono">{{ entry.alumno.matricula }}</span>
              · {{ entry.alumno.carrera }} · Grupo {{ entry.alumno.grupo }} · Semestre {{ entry.alumno.semestres }}
            </p>
            <p v-if="entry.alumno.tutor_actual" class="bitacora-tutor">
              Tutor actual: <strong>{{ nombreCompleto(entry.alumno.tutor_actual) }}</strong>
            </p>
          </div>
        </header>

        <section class="bitacora-section">
          <h4>Historial de tutores</h4>
          <ul v-if="entry.historial_tutores.length > 0" class="history-list">
            <li
              v-for="asig in entry.historial_tutores"
              :key="asig.id"
              :class="{ activo: asig.activo }"
            >
              <span>{{ asig.tutor ? nombreCompleto(asig.tutor) : '—' }}</span>
              <span>{{ asig.fecha_inicio }} — {{ asig.fecha_fin || 'Actual' }}</span>
            </li>
          </ul>
          <p v-else class="empty-section">Sin historial de tutores</p>
        </section>

        <section class="bitacora-section">
          <h4>Observaciones</h4>
          <ul v-if="entry.observaciones.length > 0" class="obs-list">
            <li v-for="obs in entry.observaciones" :key="obs.id">
              <div class="obs-meta">
                {{ obs.fecha }}
                <span v-if="obs.tutor"> · {{ nombreCompleto(obs.tutor) }}</span>
              </div>
              <p>{{ obs.contenido }}</p>
            </li>
          </ul>
          <p v-else class="empty-section">Sin observaciones en el periodo seleccionado</p>
        </section>
      </article>
    </template>
  </div>
</template>

<style scoped>
.page-header h1 {
  margin: 0 0 0.5rem;
  color: #1e3a5f;
  font-size: 1.75rem;
}

.subtitle {
  color: #64748b;
  margin: 0 0 1.5rem;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.6rem 1rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.tab-btn.active {
  background: #2d6a4f;
  border-color: #2d6a4f;
  color: #fff;
}

.filters-card {
  background: #fff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.filters-card h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #334155;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.field input,
.field select {
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
}

.filters-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.alert.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: #fff;
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.summary-card.success .summary-value {
  color: #2d6a4f;
}

.summary-card.warning .summary-value {
  color: #d97706;
}

.summary-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1e3a5f;
  line-height: 1.2;
}

.summary-label {
  font-size: 0.85rem;
  color: #64748b;
}

.period-label {
  color: #64748b;
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.table-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.table-card h3 {
  margin: 0;
  padding: 1rem 1.25rem;
  font-size: 0.95rem;
  color: #1e3a5f;
  border-bottom: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 0.875rem 1.25rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table .name {
  font-weight: 500;
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
}

.empty {
  text-align: center;
  color: #94a3b8;
  padding: 2rem !important;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 2rem;
  background: #fff;
  border-radius: 10px;
}

.btn-primary {
  padding: 0.65rem 1.25rem;
  background: #2d6a4f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1b4332;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.65rem 1.25rem;
  background: #fff;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.bitacora-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.bitacora-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.bitacora-header h3 {
  margin: 0 0 0.35rem;
  color: #1e3a5f;
  font-size: 1.1rem;
}

.bitacora-meta {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.bitacora-tutor {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #334155;
}

.bitacora-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.bitacora-section:last-child {
  border-bottom: none;
}

.bitacora-section h4 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: #334155;
}

.empty-section {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}

.history-list,
.obs-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.history-list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: #f8fafc;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.history-list li.activo {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.obs-list li {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.obs-meta {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.obs-list p {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
  white-space: pre-wrap;
}

@media (max-width: 640px) {
  .history-list li {
    flex-direction: column;
    gap: 0.25rem;
  }

  .table-card {
    overflow-x: auto;
  }
}
</style>
