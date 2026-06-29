<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div>
    <header class="page-header">
      <h1>Bienvenido, {{ auth.nombreCompleto }}</h1>
      <p>Panel de control — Rol: <strong>{{ auth.rolNombre }}</strong></p>
    </header>

    <section class="cards">
      <div class="card">
        <h3>Acceso autorizado</h3>
        <p>Has iniciado sesión correctamente en el Sistema de Control de Tutorías.</p>
      </div>
      <div class="card">
        <h3>Tu rol</h3>
        <p class="role">{{ auth.rolNombre }}</p>
        <p class="desc">{{ auth.user?.rol?.descripcion }}</p>
      </div>
    </section>
  </div>
</template>
