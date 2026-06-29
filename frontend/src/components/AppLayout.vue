<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { obtenerMenuPorPermisos } from '@/config/menu'

const auth = useAuthStore()
const router = useRouter()

const menuItems = computed(() => obtenerMenuPorPermisos(auth.permisos))

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="flex w-[260px] shrink-0 flex-col bg-brand-navy text-white">
      <div class="border-b border-white/10 p-6">
        <h2 class="mb-2 text-xl font-semibold">Tutorías</h2>
        <span class="sidebar-role-badge">{{ auth.rolNombre }}</span>
      </div>

      <nav class="flex flex-1 flex-col gap-1 py-4">
        <RouterLink
          v-for="item in menuItems"
          :key="item.route"
          :to="item.route"
          class="nav-link"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-white/10 p-6">
        <div class="mb-4 flex flex-col gap-1">
          <span class="text-sm font-semibold">{{ auth.nombreCompleto }}</span>
          <span class="text-xs text-white/60">{{ auth.user?.correo }}</span>
        </div>
        <button type="button" class="btn-logout" @click="handleLogout">
          Cerrar sesión
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto bg-slate-100 p-8">
      <RouterView />
    </main>
  </div>
</template>
