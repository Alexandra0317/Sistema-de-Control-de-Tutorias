<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const correo = ref('')
const password = ref('')

async function handleSubmit() {
  const success = await auth.login(correo.value.trim(), password.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>Sistema de Tutorías</h1>
        <p>Inicia sesión para continuar</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="correo">Correo electrónico</label>
          <input
            id="correo"
            v-model="correo"
            type="email"
            autocomplete="username"
            placeholder="usuario@ejemplo.com"
            required
          />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="auth.error" class="alert error">{{ auth.error }}</p>

        <button type="submit" class="btn-primary" :disabled="auth.loading">
          {{ auth.loading ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>
      </form>
    </div>
  </div>
</template>
