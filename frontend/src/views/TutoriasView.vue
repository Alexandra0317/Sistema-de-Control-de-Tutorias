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
  <div>
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
