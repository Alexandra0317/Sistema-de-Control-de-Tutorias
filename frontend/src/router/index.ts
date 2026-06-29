import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tienePermiso } from '@/config/menu'
import AppLayout from '@/components/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { recurso: 'dashboard', accion: 'leer' },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('@/views/UsuariosView.vue'),
          meta: { recurso: 'usuarios', accion: 'leer' },
        },
        {
          path: 'tutorias',
          name: 'tutorias',
          component: () => import('@/views/TutoriasView.vue'),
          meta: { recurso: 'tutorias', accion: 'leer' },
        },
        {
          path: 'estudiantes',
          name: 'estudiantes',
          component: () => import('@/views/EstudiantesView.vue'),
          meta: { recurso: 'estudiantes', accion: 'leer' },
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('@/views/ReportesView.vue'),
          meta: { recurso: 'reportes', accion: 'leer' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.user && auth.token) {
    await auth.restoreSession()
  }

  if (to.meta.public) {
    if (auth.isAuthenticated) {
      return '/dashboard'
    }
    return true
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const recurso = to.meta.recurso as string | undefined
  const accion = to.meta.accion as string | undefined

  if (recurso && accion && !tienePermiso(auth.permisos, recurso, accion)) {
    return '/dashboard'
  }

  return true
})

export default router
