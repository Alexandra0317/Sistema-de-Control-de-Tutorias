<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="page">
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

<style scoped>
.page-header h1 {
  margin: 0 0 0.5rem;
  color: #1e3a5f;
  font-size: 1.75rem;
}

.page-header p {
  color: #64748b;
  margin: 0 0 2rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card h3 {
  margin: 0 0 0.75rem;
  color: #334155;
  font-size: 1rem;
}

.card p {
  margin: 0;
  color: #64748b;
  line-height: 1.5;
}

.role {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d6a4f !important;
  text-transform: capitalize;
  margin-bottom: 0.5rem !important;
}

.desc {
  font-size: 0.9rem;
}
</style>
