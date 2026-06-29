<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tienePermiso } from '@/config/menu'
import * as estudiantesService from '@/services/estudiantes'
import type { Estudiante, Observacion, TutorBrief } from '@/types/estudiantes'

const auth = useAuthStore()

const matriculaBusqueda = ref('')
const estudiante = ref<Estudiante | null>(null)
const observaciones = ref<Observacion[]>([])
const buscando = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const formError = ref<string | null>(null)

const nuevaObservacion = ref('')
const fechaObservacion = ref(new Date().toISOString().slice(0, 10))

const esAdmin = computed(() => auth.rolNombre === 'administrador')
const puedeObservar = computed(() => tienePermiso(auth.permisos, 'observaciones', 'crear'))

function nombreCompleto(item: { nombre: string; apellido_paterno: string; apellido_materno?: string | null }) {
  return [item.nombre, item.apellido_paterno, item.apellido_materno].filter(Boolean).join(' ')
}

function nombreTutor(tutor: TutorBrief | null) {
  if (!tutor) return '—'
  return nombreCompleto(tutor)
}

function limpiarResultado() {
  estudiante.value = null
  observaciones.value = []
  formError.value = null
  nuevaObservacion.value = ''
  fechaObservacion.value = new Date().toISOString().slice(0, 10)
}

async function buscarAlumno() {
  if (!auth.token) return

  const matricula = matriculaBusqueda.value.trim()

  if (matricula.length !== 10) {
    error.value = 'La matrícula debe tener exactamente 10 caracteres'
    limpiarResultado()
    return
  }

  buscando.value = true
  error.value = null
  success.value = null
  formError.value = null
  limpiarResultado()

  try {
    const { student } = await estudiantesService.fetchEstudiantePorMatricula(auth.token, matricula)
    estudiante.value = student

    const obsRes = await estudiantesService.fetchObservaciones(auth.token, student.id)
    observaciones.value = obsRes.observaciones
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al buscar alumno'
  } finally {
    buscando.value = false
  }
}

const puedeAgregarObservacion = computed(() => {
  if (!puedeObservar.value || !estudiante.value) return false
  if (esAdmin.value) return true
  return estudiante.value.tutor_actual?.id === auth.user?.id
})

async function guardarObservacion() {
  if (!auth.token || !estudiante.value) return

  if (!nuevaObservacion.value.trim()) {
    formError.value = 'Escribe el contenido de la observación'
    return
  }

  submitting.value = true
  formError.value = null

  try {
    const { observacion } = await estudiantesService.createObservacion(
      auth.token,
      estudiante.value.id,
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
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Tutorías</h1>
        <p class="subtitle">Busca un alumno por matrícula y registra observaciones</p>
      </div>
    </header>

    <p v-if="success" class="alert success">{{ success }}</p>
    <p v-if="error" class="alert error">{{ error }}</p>

    <section class="search-card">
      <form class="search-form" @submit.prevent="buscarAlumno">
        <div class="field search-field">
          <label for="matricula-busqueda">Matrícula del alumno</label>
          <input
            id="matricula-busqueda"
            v-model="matriculaBusqueda"
            type="text"
            maxlength="10"
            minlength="10"
            placeholder="Ej. 2024001234"
            autocomplete="off"
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="buscando">
          {{ buscando ? 'Buscando...' : 'Buscar' }}
        </button>
      </form>
    </section>

    <section v-if="estudiante" class="result-card">
      <h2>Datos del alumno</h2>

      <div class="detail-grid">
        <div><span class="label">Matrícula</span>{{ estudiante.matricula }}</div>
        <div><span class="label">Nombre</span>{{ nombreCompleto(estudiante) }}</div>
        <div><span class="label">Carrera</span>{{ estudiante.carrera }}</div>
        <div><span class="label">Grupo</span>{{ estudiante.grupo }}</div>
        <div><span class="label">Semestre</span>{{ estudiante.semestres }}</div>
        <div><span class="label">Tutor actual</span>{{ nombreTutor(estudiante.tutor_actual) }}</div>
      </div>

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
              {{ submitting ? 'Guardando...' : 'Agregar observación' }}
            </button>
          </div>
        </form>

        <p v-else-if="!puedeObservar" class="hint">
          No tienes permiso para registrar observaciones.
        </p>
        <p v-else class="hint">
          Solo el tutor actual puede registrar observaciones para este alumno.
        </p>

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

        <p v-if="formError" class="alert error">{{ formError }}</p>
      </section>
    </section>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0 0 0.25rem;
  color: #1e3a5f;
  font-size: 1.75rem;
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #1e3a5f;
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
  margin: 0 0 1rem;
}

.search-card,
.result-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.search-form {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-field {
  flex: 1;
  min-width: 220px;
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
.field textarea {
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
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
  opacity: 0.6;
  cursor: not-allowed;
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
  margin-bottom: 0;
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

.obs-list {
  list-style: none;
  margin: 0;
  padding: 0;
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
  margin-bottom: 0;
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
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
