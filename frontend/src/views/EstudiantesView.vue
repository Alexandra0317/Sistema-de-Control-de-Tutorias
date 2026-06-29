<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tienePermiso } from '@/config/menu'
import * as estudiantesService from '@/services/estudiantes'
import type {
  AsignacionTutor,
  CreateEstudiantePayload,
  Estudiante,
  Observacion,
  TutorBrief,
} from '@/types/estudiantes'

const auth = useAuthStore()

const estudiantes = ref<Estudiante[]>([])
const tutores = ref<TutorBrief[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showChangeTutorModal = ref(false)
const selectedStudent = ref<Estudiante | null>(null)
const historial = ref<AsignacionTutor[]>([])
const observaciones = ref<Observacion[]>([])
const submitting = ref(false)
const formError = ref<string | null>(null)

const esAdmin = computed(() => auth.rolNombre === 'administrador')
const puedeCrear = computed(() => tienePermiso(auth.permisos, 'estudiantes', 'crear'))
const puedeActualizar = computed(() => tienePermiso(auth.permisos, 'estudiantes', 'actualizar'))
const puedeEliminar = computed(() => tienePermiso(auth.permisos, 'estudiantes', 'eliminar'))
const puedeObservar = computed(() => tienePermiso(auth.permisos, 'observaciones', 'crear'))

const formNuevo = ref<CreateEstudiantePayload>({
  matricula: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  semestres: 1,
  carrera: '',
  grupo: '',
  tutor_id: undefined,
})

const formEditar = ref({
  matricula: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  semestres: 1,
  carrera: '',
  grupo: '',
})

const nuevoTutorId = ref(0)
const nuevaObservacion = ref('')
const fechaObservacion = ref(new Date().toISOString().slice(0, 10))

function nombreCompleto(item: { nombre: string; apellido_paterno: string; apellido_materno?: string | null }) {
  return [item.nombre, item.apellido_paterno, item.apellido_materno].filter(Boolean).join(' ')
}

function nombreTutor(tutor: TutorBrief | null) {
  if (!tutor) return '—'
  return nombreCompleto(tutor)
}

function resetFormNuevo() {
  formNuevo.value = {
    matricula: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    semestres: 1,
    carrera: '',
    grupo: '',
    tutor_id: tutores.value[0]?.id,
  }
  formError.value = null
}

async function cargarDatos() {
  if (!auth.token) return

  loading.value = true
  error.value = null

  try {
    const [estRes, tutRes] = await Promise.all([
      estudiantesService.fetchEstudiantes(auth.token),
      esAdmin.value
        ? estudiantesService.fetchTutores(auth.token)
        : Promise.resolve({ tutores: [] }),
    ])
    estudiantes.value = estRes.students
    tutores.value = tutRes.tutores
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar estudiantes'
  } finally {
    loading.value = false
  }
}

function abrirCrear() {
  resetFormNuevo()
  showCreateModal.value = true
}

function cerrarCrear() {
  showCreateModal.value = false
  formError.value = null
}

function abrirEditar(estudiante: Estudiante) {
  selectedStudent.value = estudiante
  formEditar.value = {
    matricula: estudiante.matricula,
    nombre: estudiante.nombre,
    apellido_paterno: estudiante.apellido_paterno,
    apellido_materno: estudiante.apellido_materno ?? '',
    semestres: estudiante.semestres,
    carrera: estudiante.carrera,
    grupo: estudiante.grupo,
  }
  formError.value = null
  showEditModal.value = true
}

function cerrarEditar() {
  showEditModal.value = false
  selectedStudent.value = null
  formError.value = null
}

async function abrirDetalle(estudiante: Estudiante) {
  if (!auth.token) return

  selectedStudent.value = estudiante
  formError.value = null
  nuevaObservacion.value = ''
  fechaObservacion.value = new Date().toISOString().slice(0, 10)
  showDetailModal.value = true

  try {
    const [histRes, obsRes] = await Promise.all([
      estudiantesService.fetchHistorialTutores(auth.token, estudiante.id),
      estudiantesService.fetchObservaciones(auth.token, estudiante.id),
    ])
    historial.value = histRes.historial
    observaciones.value = obsRes.observaciones
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Error al cargar detalle'
  }
}

function cerrarDetalle() {
  showDetailModal.value = false
  selectedStudent.value = null
  historial.value = []
  observaciones.value = []
  formError.value = null
}

function abrirCambiarTutor(estudiante: Estudiante) {
  selectedStudent.value = estudiante
  nuevoTutorId.value = tutores.value.find((t) => t.id !== estudiante.tutor_actual?.id)?.id ?? 0
  formError.value = null
  showChangeTutorModal.value = true
}

function cerrarCambiarTutor() {
  showChangeTutorModal.value = false
  selectedStudent.value = null
  formError.value = null
}

async function guardarNuevo() {
  if (!auth.token) return

  formError.value = null

  if (!formNuevo.value.matricula || formNuevo.value.matricula.length !== 10
    || !formNuevo.value.nombre || !formNuevo.value.apellido_paterno
    || !formNuevo.value.carrera || !formNuevo.value.grupo) {
    formError.value = 'Completa los campos obligatorios (matrícula de 10 caracteres)'
    return
  }

  if (esAdmin.value && !formNuevo.value.tutor_id) {
    formError.value = 'Selecciona un profesor tutor'
    return
  }

  submitting.value = true

  try {
    const payload: CreateEstudiantePayload = {
      ...formNuevo.value,
      semestres: Number(formNuevo.value.semestres),
      apellido_materno: formNuevo.value.apellido_materno || undefined,
    }

    if (!esAdmin.value) {
      delete payload.tutor_id
    }

    const { student } = await estudiantesService.createEstudiante(auth.token, payload)
    estudiantes.value = [...estudiantes.value, student].sort((a, b) =>
      nombreCompleto(a).localeCompare(nombreCompleto(b)),
    )
    success.value = 'Alumno registrado correctamente'
    cerrarCrear()
    setTimeout(() => { success.value = null }, 3000)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Error al crear alumno'
  } finally {
    submitting.value = false
  }
}

async function guardarEdicion() {
  if (!auth.token || !selectedStudent.value) return

  formError.value = null
  submitting.value = true

  try {
    const { student } = await estudiantesService.updateEstudiante(
      auth.token,
      selectedStudent.value.id,
      {
        ...formEditar.value,
        semestres: Number(formEditar.value.semestres),
        apellido_materno: formEditar.value.apellido_materno || undefined,
      },
    )

    estudiantes.value = estudiantes.value
      .map((e) => (e.id === student.id ? student : e))
      .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))

    success.value = 'Alumno actualizado correctamente'
    cerrarEditar()
    setTimeout(() => { success.value = null }, 3000)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Error al actualizar alumno'
  } finally {
    submitting.value = false
  }
}

async function confirmarEliminar(estudiante: Estudiante) {
  if (!auth.token || !puedeEliminar.value) return
  if (!confirm(`¿Eliminar al alumno ${nombreCompleto(estudiante)} (${estudiante.matricula})?`)) return

  try {
    await estudiantesService.deleteEstudiante(auth.token, estudiante.id)
    estudiantes.value = estudiantes.value.filter((e) => e.id !== estudiante.id)
    success.value = 'Alumno eliminado'
    setTimeout(() => { success.value = null }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al eliminar alumno'
  }
}

async function guardarCambioTutor() {
  if (!auth.token || !selectedStudent.value || !nuevoTutorId.value) return

  formError.value = null
  submitting.value = true

  try {
    const { student } = await estudiantesService.changeTutor(
      auth.token,
      selectedStudent.value.id,
      nuevoTutorId.value,
    )

    estudiantes.value = estudiantes.value.map((e) => (e.id === student.id ? student : e))
    success.value = 'Tutor actualizado correctamente'
    cerrarCambiarTutor()
    setTimeout(() => { success.value = null }, 3000)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Error al cambiar tutor'
  } finally {
    submitting.value = false
  }
}

async function guardarObservacion() {
  if (!auth.token || !selectedStudent.value) return

  if (!nuevaObservacion.value.trim()) {
    formError.value = 'Escribe el contenido de la observación'
    return
  }

  submitting.value = true
  formError.value = null

  try {
    const { observacion } = await estudiantesService.createObservacion(
      auth.token,
      selectedStudent.value.id,
      nuevaObservacion.value.trim(),
      fechaObservacion.value,
    )
    observaciones.value = [observacion, ...observaciones.value]
    nuevaObservacion.value = ''
    success.value = 'Observación registrada'
    setTimeout(() => { success.value = null }, 3000)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Error al guardar observación'
  } finally {
    submitting.value = false
  }
}

const puedeAgregarObservacion = computed(() => {
  if (!puedeObservar.value || !selectedStudent.value) return false
  if (esAdmin.value) return true
  return selectedStudent.value.tutor_actual?.id === auth.user?.id
})

onMounted(cargarDatos)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Estudiantes</h1>
        <p class="subtitle">Gestión de alumnos y tutorías asignadas</p>
      </div>
      <button
        v-if="puedeCrear"
        type="button"
        class="btn-primary"
        @click="abrirCrear"
      >
        + Nuevo alumno
      </button>
    </header>

    <p v-if="success" class="alert success">{{ success }}</p>
    <p v-if="error" class="alert error">{{ error }}</p>

    <div v-if="loading" class="loading">Cargando estudiantes...</div>

    <div v-else class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Nombre</th>
            <th>Carrera</th>
            <th>Grupo</th>
            <th>Sem.</th>
            <th>Tutor actual</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="estudiantes.length === 0">
            <td colspan="7" class="empty">No hay alumnos registrados</td>
          </tr>
          <tr v-for="estudiante in estudiantes" :key="estudiante.id">
            <td class="mono">{{ estudiante.matricula }}</td>
            <td class="name">{{ nombreCompleto(estudiante) }}</td>
            <td>{{ estudiante.carrera }}</td>
            <td>{{ estudiante.grupo }}</td>
            <td>{{ estudiante.semestres }}</td>
            <td>{{ nombreTutor(estudiante.tutor_actual) }}</td>
            <td class="col-actions actions-cell">
              <button type="button" class="btn-link" @click="abrirDetalle(estudiante)">
                Ver
              </button>
              <button
                v-if="puedeActualizar"
                type="button"
                class="btn-link"
                @click="abrirEditar(estudiante)"
              >
                Editar
              </button>
              <button
                v-if="esAdmin && puedeActualizar"
                type="button"
                class="btn-link"
                @click="abrirCambiarTutor(estudiante)"
              >
                Cambiar tutor
              </button>
              <button
                v-if="puedeEliminar"
                type="button"
                class="btn-link danger"
                @click="confirmarEliminar(estudiante)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: nuevo alumno -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="cerrarCrear">
      <div class="modal">
        <header class="modal-header">
          <h2>Nuevo alumno</h2>
          <button type="button" class="btn-close" @click="cerrarCrear">×</button>
        </header>

        <form class="modal-form" @submit.prevent="guardarNuevo">
          <div class="field">
            <label for="matricula">Matrícula * (10 caracteres)</label>
            <input
              id="matricula"
              v-model="formNuevo.matricula"
              type="text"
              maxlength="10"
              minlength="10"
              required
            />
          </div>

          <div class="form-row">
            <div class="field">
              <label for="nombre">Nombre *</label>
              <input id="nombre" v-model="formNuevo.nombre" type="text" required />
            </div>
            <div class="field">
              <label for="ap-paterno">Apellido paterno *</label>
              <input id="ap-paterno" v-model="formNuevo.apellido_paterno" type="text" required />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="ap-materno">Apellido materno</label>
              <input id="ap-materno" v-model="formNuevo.apellido_materno" type="text" />
            </div>
            <div class="field">
              <label for="semestres">Semestre *</label>
              <input
                id="semestres"
                v-model.number="formNuevo.semestres"
                type="number"
                min="1"
                max="12"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="carrera">Carrera *</label>
              <input id="carrera" v-model="formNuevo.carrera" type="text" required />
            </div>
            <div class="field">
              <label for="grupo">Grupo *</label>
              <input id="grupo" v-model="formNuevo.grupo" type="text" required />
            </div>
          </div>

          <div v-if="esAdmin" class="field">
            <label for="tutor">Profesor tutor *</label>
            <select id="tutor" v-model.number="formNuevo.tutor_id" required>
              <option v-for="tutor in tutores" :key="tutor.id" :value="tutor.id">
                {{ nombreCompleto(tutor) }} — {{ tutor.correo }}
              </option>
            </select>
          </div>

          <p v-else class="hint">
            El alumno quedará asignado a ti como tutor.
          </p>

          <p v-if="formError" class="alert error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarCrear">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Registrar alumno' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: editar alumno -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="cerrarEditar">
      <div class="modal">
        <header class="modal-header">
          <h2>Editar alumno</h2>
          <button type="button" class="btn-close" @click="cerrarEditar">×</button>
        </header>

        <form class="modal-form" @submit.prevent="guardarEdicion">
          <div class="field">
            <label for="edit-matricula">Matrícula *</label>
            <input
              id="edit-matricula"
              v-model="formEditar.matricula"
              type="text"
              maxlength="10"
              minlength="10"
              required
            />
          </div>

          <div class="form-row">
            <div class="field">
              <label for="edit-nombre">Nombre *</label>
              <input id="edit-nombre" v-model="formEditar.nombre" type="text" required />
            </div>
            <div class="field">
              <label for="edit-ap-paterno">Apellido paterno *</label>
              <input id="edit-ap-paterno" v-model="formEditar.apellido_paterno" type="text" required />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="edit-ap-materno">Apellido materno</label>
              <input id="edit-ap-materno" v-model="formEditar.apellido_materno" type="text" />
            </div>
            <div class="field">
              <label for="edit-semestres">Semestre *</label>
              <input
                id="edit-semestres"
                v-model.number="formEditar.semestres"
                type="number"
                min="1"
                max="12"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="edit-carrera">Carrera *</label>
              <input id="edit-carrera" v-model="formEditar.carrera" type="text" required />
            </div>
            <div class="field">
              <label for="edit-grupo">Grupo *</label>
              <input id="edit-grupo" v-model="formEditar.grupo" type="text" required />
            </div>
          </div>

          <p v-if="formError" class="alert error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarEditar">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: cambiar tutor -->
    <div v-if="showChangeTutorModal" class="modal-overlay" @click.self="cerrarCambiarTutor">
      <div class="modal modal-sm">
        <header class="modal-header">
          <h2>Cambiar tutor</h2>
          <button type="button" class="btn-close" @click="cerrarCambiarTutor">×</button>
        </header>

        <form class="modal-form" @submit.prevent="guardarCambioTutor">
          <p v-if="selectedStudent" class="modal-subtitle">
            Alumno: <strong>{{ nombreCompleto(selectedStudent) }}</strong>
          </p>

          <div class="field">
            <label for="nuevo-tutor">Nuevo profesor tutor *</label>
            <select id="nuevo-tutor" v-model.number="nuevoTutorId" required>
              <option
                v-for="tutor in tutores.filter((t) => t.id !== selectedStudent?.tutor_actual?.id)"
                :key="tutor.id"
                :value="tutor.id"
              >
                {{ nombreCompleto(tutor) }}
              </option>
            </select>
          </div>

          <p class="hint">
            El tutor anterior quedará en el historial junto con sus observaciones.
          </p>

          <p v-if="formError" class="alert error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarCambiarTutor">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Asignar tutor' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: detalle, historial y observaciones -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="cerrarDetalle">
      <div class="modal modal-lg">
        <header class="modal-header">
          <h2>Detalle del alumno</h2>
          <button type="button" class="btn-close" @click="cerrarDetalle">×</button>
        </header>

        <div v-if="selectedStudent" class="modal-body">
          <div class="detail-grid">
            <div><span class="label">Matrícula</span>{{ selectedStudent.matricula }}</div>
            <div><span class="label">Nombre</span>{{ nombreCompleto(selectedStudent) }}</div>
            <div><span class="label">Carrera</span>{{ selectedStudent.carrera }}</div>
            <div><span class="label">Grupo</span>{{ selectedStudent.grupo }}</div>
            <div><span class="label">Semestre</span>{{ selectedStudent.semestres }}</div>
            <div><span class="label">Tutor actual</span>{{ nombreTutor(selectedStudent.tutor_actual) }}</div>
          </div>

          <section class="section">
            <h3>Historial de tutores</h3>
            <div v-if="historial.length === 0" class="empty-section">Sin historial</div>
            <ul v-else class="history-list">
              <li v-for="asig in historial" :key="asig.id" :class="{ activo: asig.activo }">
                <strong>{{ nombreTutor(asig.tutor) }}</strong>
                <span>{{ asig.fecha_inicio }} — {{ asig.activo ? 'Actual' : asig.fecha_fin }}</span>
              </li>
            </ul>
          </section>

          <section class="section">
            <h3>Observaciones</h3>

            <form
              v-if="puedeAgregarObservacion"
              class="obs-form"
              @submit.prevent="guardarObservacion"
            >
              <div class="field">
                <label for="obs-contenido">Nueva observación</label>
                <textarea
                  id="obs-contenido"
                  v-model="nuevaObservacion"
                  rows="3"
                  placeholder="Escribe una observación sobre el alumno..."
                />
              </div>
              <div class="obs-form-row">
                <div class="field">
                  <label for="obs-fecha">Fecha</label>
                  <input id="obs-fecha" v-model="fechaObservacion" type="date" />
                </div>
                <button type="submit" class="btn-primary" :disabled="submitting">
                  {{ submitting ? 'Guardando...' : 'Agregar' }}
                </button>
              </div>
            </form>

            <div v-if="observaciones.length === 0" class="empty-section">Sin observaciones</div>
            <ul v-else class="obs-list">
              <li v-for="obs in observaciones" :key="obs.id">
                <div class="obs-meta">
                  <span>{{ obs.fecha }}</span>
                  <span v-if="obs.tutor">— {{ nombreTutor(obs.tutor) }}</span>
                </div>
                <p>{{ obs.contenido }}</p>
              </li>
            </ul>
          </section>

          <p v-if="formError" class="alert error">{{ formError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0 0 0.25rem;
  color: #1e3a5f;
  font-size: 1.75rem;
}

.subtitle {
  color: #64748b;
  margin: 0;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin: 0 0 1rem;
}

.alert.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.hint {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.loading {
  color: #64748b;
  padding: 2rem;
  text-align: center;
}

.table-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
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

.col-actions {
  min-width: 180px;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty {
  text-align: center;
  color: #94a3b8;
  padding: 2rem !important;
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
  white-space: nowrap;
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

.btn-link {
  background: none;
  border: none;
  color: #2d6a4f;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.btn-link.danger {
  color: #dc2626;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1.5rem;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-sm {
  max-width: 420px;
}

.modal-lg {
  max-width: 720px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: #1e3a5f;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
}

.modal-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.modal-form,
.modal-body {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
.field select,
.field textarea {
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.5rem;
  margin-bottom: 1.5rem;
}

.detail-grid .label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.15rem;
}

.section {
  margin-bottom: 1.5rem;
}

.section h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: #1e3a5f;
}

.empty-section {
  color: #94a3b8;
  font-size: 0.875rem;
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

.obs-form {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.obs-form-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.obs-form-row .field {
  flex: 1;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }

  .form-row,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .table-card {
    overflow-x: auto;
  }
}
</style>
