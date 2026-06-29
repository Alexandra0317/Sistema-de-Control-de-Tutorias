import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/auth'
import type { Usuario } from '@/types/auth'

const TOKEN_KEY = 'tutorias_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<Usuario | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const nombreCompleto = computed(() => {
    if (!user.value) return ''
    const partes = [user.value.nombre, user.value.apellido_paterno, user.value.apellido_materno]
    return partes.filter(Boolean).join(' ')
  })
  const rolNombre = computed(() => user.value?.rol?.nombre ?? '')
  const permisos = computed(() => user.value?.rol?.permisos ?? {})

  function setSession(newToken: string, newUser: Usuario) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function login(correo: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(correo, password)
      setSession(response.token, response.user)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al iniciar sesión'
      return false
    } finally {
      loading.value = false
    }
  }

  async function restoreSession() {
    if (!token.value) return false

    loading.value = true
    error.value = null

    try {
      const currentUser = await authService.fetchCurrentUser(token.value)
      user.value = currentUser
      return true
    } catch {
      clearSession()
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearSession()
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    nombreCompleto,
    rolNombre,
    permisos,
    login,
    restoreSession,
    logout,
  }
})
