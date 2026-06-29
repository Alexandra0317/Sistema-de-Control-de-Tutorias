<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { tienePermiso } from '@/config/menu'
import * as usuariosService from '@/services/usuarios'
import type { Usuario } from '@/types/auth'
import type { CreateUsuarioPayload, RolOption } from '@/types/usuarios'

const auth = useAuthStore()

const usuarios = ref<Usuario[]>([])
const roles = ref<RolOption[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUser = ref<Usuario | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)

const puedeCrear = computed(() => tienePermiso(auth.permisos, 'usuarios', 'crear'))
const puedeActualizar = computed(() => tienePermiso(auth.permisos, 'usuarios', 'actualizar'))

const formNuevo = ref<CreateUsuarioPayload>({
  correo: '',
  password: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',
  role_id: 0,
  status: 'activo',
})

const formEditar = ref({
  telefono: '',
  status: 'activo',
})

const nuevaPassword = ref('')
const confirmarPassword = ref('')

function nombreCompleto(usuario: Usuario) {
  return [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
    .filter(Boolean)
    .join(' ')
}

function resetFormNuevo() {
  formNuevo.value = {
    correo: '',
    password: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    role_id: roles.value[0]?.id ?? 0,
    status: 'activo',
  }
  formError.value = null
}

async function cargarDatos() {
  if (!auth.token) return

  loading.value = true
  error.value = null

  try {
    const [usuariosRes, rolesRes] = await Promise.all([
      usuariosService.fetchUsuarios(auth.token),
      puedeCrear.value ? usuariosService.fetchRoles(auth.token) : Promise.resolve({ roles: [] }),
    ])
    usuarios.value = usuariosRes.users
    roles.value = rolesRes.roles
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar usuarios'
  } finally {
    loading.value = false
  }
}

function abrirCrear() {
  resetFormNuevo()
  if (roles.value.length > 0) {
    formNuevo.value.role_id = roles.value[0].id
  }
  showCreateModal.value = true
}

function cerrarCrear() {
  showCreateModal.value = false
  formError.value = null
}

function abrirEditar(usuario: Usuario) {
  selectedUser.value = usuario
  formEditar.value = {
    telefono: usuario.telefono ?? '',
    status: usuario.status,
  }
  nuevaPassword.value = ''
  confirmarPassword.value = ''
  formError.value = null
  showEditModal.value = true
}

function cerrarEditar() {
  showEditModal.value = false
  selectedUser.value = null
  formError.value = null
}

async function guardarNuevo() {
  if (!auth.token) return

  formError.value = null

  if (!formNuevo.value.correo || !formNuevo.value.password || !formNuevo.value.nombre
    || !formNuevo.value.apellido_paterno || !formNuevo.value.role_id) {
    formError.value = 'Completa los campos obligatorios'
    return
  }

  if (formNuevo.value.password.length < 6) {
    formError.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  submitting.value = true

  try {
    const { user } = await usuariosService.createUsuario(auth.token, {
      ...formNuevo.value,
      apellido_materno: formNuevo.value.apellido_materno || undefined,
      telefono: formNuevo.value.telefono || undefined,
    })
    usuarios.value = [...usuarios.value, user].sort((a, b) =>
      nombreCompleto(a).localeCompare(nombreCompleto(b)),
    )
    success.value = 'Usuario creado correctamente'
    cerrarCrear()
    setTimeout(() => { success.value = null }, 3000)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Error al crear usuario'
  } finally {
    submitting.value = false
  }
}

async function guardarEdicion() {
  if (!auth.token || !selectedUser.value) return

  formError.value = null

  const quiereCambiarPassword = nuevaPassword.value.length > 0 || confirmarPassword.value.length > 0

  if (quiereCambiarPassword) {
    if (nuevaPassword.value.length < 6) {
      formError.value = 'La contraseña debe tener al menos 6 caracteres'
      return
    }
    if (nuevaPassword.value !== confirmarPassword.value) {
      formError.value = 'Las contraseñas no coinciden'
      return
    }
  }

  submitting.value = true

  try {
    const payload: { telefono: string; status: string; password?: string } = {
      telefono: formEditar.value.telefono,
      status: formEditar.value.status,
    }

    if (quiereCambiarPassword) {
      payload.password = nuevaPassword.value
    }

    const { user } = await usuariosService.updateUsuario(
      auth.token,
      selectedUser.value.id,
      payload,
    )

    usuarios.value = usuarios.value
      .map((u) => (u.id === user.id ? user : u))
      .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))

    success.value = `Usuario ${nombreCompleto(user)} actualizado correctamente`
    cerrarEditar()
    setTimeout(() => { success.value = null }, 3000)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Error al actualizar usuario'
  } finally {
    submitting.value = false
  }
}

onMounted(cargarDatos)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Usuarios</h1>
        <p class="subtitle">Gestión de usuarios del sistema</p>
      </div>
      <button
        v-if="puedeCrear"
        type="button"
        class="btn-primary"
        @click="abrirCrear"
      >
        + Nuevo usuario
      </button>
    </header>

    <p v-if="success" class="alert success">{{ success }}</p>
    <p v-if="error" class="alert error">{{ error }}</p>

    <div v-if="loading" class="loading">Cargando usuarios...</div>

    <div v-else class="table-card">
      <table class="users-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th v-if="puedeActualizar" class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="usuarios.length === 0">
            <td :colspan="puedeActualizar ? 6 : 5" class="empty">No hay usuarios registrados</td>
          </tr>
          <tr v-for="usuario in usuarios" :key="usuario.id">
            <td class="name">{{ nombreCompleto(usuario) }}</td>
            <td>{{ usuario.correo }}</td>
            <td>
              <span class="role-badge">{{ usuario.rol?.nombre ?? '—' }}</span>
            </td>
            <td>{{ usuario.telefono || '—' }}</td>
            <td>
              <span :class="['status-badge', usuario.status]">{{ usuario.status }}</span>
            </td>
            <td v-if="puedeActualizar" class="col-actions">
              <button
                type="button"
                class="btn-link"
                @click="abrirEditar(usuario)"
              >
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: nuevo usuario -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="cerrarCrear">
      <div class="modal">
        <header class="modal-header">
          <h2>Nuevo usuario</h2>
          <button type="button" class="btn-close" @click="cerrarCrear">×</button>
        </header>

        <form class="modal-form" @submit.prevent="guardarNuevo">
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
              <label for="telefono">Teléfono</label>
              <input id="telefono" v-model="formNuevo.telefono" type="tel" />
            </div>
          </div>

          <div class="field">
            <label for="correo">Correo electrónico *</label>
            <input id="correo" v-model="formNuevo.correo" type="email" required />
          </div>

          <div class="field">
            <label for="password-nuevo">Contraseña *</label>
            <input
              id="password-nuevo"
              v-model="formNuevo.password"
              type="password"
              minlength="6"
              required
            />
          </div>

          <div class="form-row">
            <div class="field">
              <label for="rol">Rol *</label>
              <select id="rol" v-model.number="formNuevo.role_id" required>
                <option v-for="rol in roles" :key="rol.id" :value="rol.id">
                  {{ rol.nombre }} — {{ rol.descripcion }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="status">Estado</label>
              <select id="status" v-model="formNuevo.status">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <p v-if="formError" class="alert error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarCrear">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Crear usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: editar usuario -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="cerrarEditar">
      <div class="modal">
        <header class="modal-header">
          <h2>Editar usuario</h2>
          <button type="button" class="btn-close" @click="cerrarEditar">×</button>
        </header>

        <p v-if="selectedUser" class="modal-subtitle">
          Usuario: <strong>{{ nombreCompleto(selectedUser) }}</strong> — {{ selectedUser.correo }}
        </p>

        <form class="modal-form" @submit.prevent="guardarEdicion">
          <div class="form-row">
            <div class="field">
              <label for="edit-telefono">Teléfono</label>
              <input id="edit-telefono" v-model="formEditar.telefono" type="tel" />
            </div>
            <div class="field">
              <label for="edit-status">Estado</label>
              <select id="edit-status" v-model="formEditar.status">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="section-divider">
            <span>Cambiar contraseña (opcional)</span>
          </div>

          <div class="field">
            <label for="nueva-password">Nueva contraseña</label>
            <input
              id="nueva-password"
              v-model="nuevaPassword"
              type="password"
              minlength="6"
              placeholder="Dejar vacío para no cambiar"
            />
          </div>

          <div class="field">
            <label for="confirmar-password">Confirmar contraseña</label>
            <input
              id="confirmar-password"
              v-model="confirmarPassword"
              type="password"
              minlength="6"
              placeholder="Dejar vacío para no cambiar"
            />
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

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.users-table th {
  text-align: left;
  padding: 0.875rem 1.25rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.users-table td {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.users-table tr:last-child td {
  border-bottom: none;
}

.users-table .name {
  font-weight: 500;
}

.col-actions {
  width: 100px;
  text-align: right;
}

.empty {
  text-align: center;
  color: #94a3b8;
  padding: 2rem !important;
}

.role-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.status-badge.activo {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactivo {
  background: #f1f5f9;
  color: #64748b;
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
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-link {
  background: none;
  border: none;
  color: #2d6a4f;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.btn-link:hover {
  color: #1b4332;
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

.btn-close:hover {
  color: #475569;
}

.modal-subtitle {
  padding: 1rem 1.5rem 0;
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
.field select {
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .table-card {
    overflow-x: auto;
  }
}
</style>
