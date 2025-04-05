import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Track initialization state
let authInitialized = false
let initialAuthPromise: Promise<void> | null = null

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
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/similar',
    name: 'SimilarObjectsDemo',
    component: () => import('@/views/SimilarObjectsDemo.vue'),
    meta: {
      requiresAuth: true
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

// Function to ensure auth is initialized before proceeding with navigation
const ensureAuthInitialized = async () => {
  if (authInitialized) {
    return // Already initialized
  }
  
  if (!initialAuthPromise) {
    // Start initialization
    const authStore = useAuthStore()
    initialAuthPromise = authStore.initAuth().then(() => {
      authInitialized = true
    })
  }
  
  // Wait for initialization to complete
  await initialAuthPromise
}

router.beforeEach(async (to, _, next) => {
  // Wait for auth to be initialized before making routing decisions
  await ensureAuthInitialized()
  
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth as boolean
  const requiresAdmin = to.meta.requiresAdmin as boolean

  console.log('Navigation: ', { to: to.path, requiresAuth, requiresAdmin })
  console.log('Auth state: ', { isAuthenticated: authStore.isAuthenticated, isAdmin: authStore.isAdmin })

  // If route doesn't require authentication, allow access
  if (!requiresAuth) {
    console.log('Route does not require auth, allowing access')
    next()
    return
  }

  // If user is not authenticated and route requires authentication, redirect to login
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('Route requires auth but user is not authenticated, redirecting to login')
    next({ name: 'Login' })
    return
  }

  // If route requires admin role but user is not admin, redirect to home
  if (requiresAdmin && !authStore.isAdmin) {
    console.log('Route requires admin but user is not admin, redirecting to home')
    next({ name: 'Home' })
    return
  }

  // Otherwise allow access
  console.log('All checks passed, allowing access')
  next()
})

export default router 