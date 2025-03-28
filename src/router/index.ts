import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export interface RouteMeta {
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

// The modules will be created dynamically, so we can ignore the module not found errors
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth as boolean
  const requiresAdmin = to.meta.requiresAdmin as boolean

  // If route doesn't require authentication, allow access
  if (!requiresAuth) {
    next()
    return
  }

  // If user is not authenticated and route requires authentication, redirect to login
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' })
    return
  }

  // If route requires admin role but user is not admin, redirect to home
  if (requiresAdmin && (!authStore.user || !authStore.user.isAdmin)) {
    next({ name: 'Home' })
    return
  }

  // Otherwise allow access
  next()
})

export default router 