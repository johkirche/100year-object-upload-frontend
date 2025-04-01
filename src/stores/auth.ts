import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createDirectus, rest, authentication, readMe } from '@directus/sdk'
import type { AuthenticationData } from '@directus/sdk'
import type { Users } from '@/client/types.gen'


// Storage class for persistent authentication
class LocalStorage {
  private storageKey = 'directus-auth'

  get(): AuthenticationData | null {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : null
  }

  set(data: AuthenticationData | null): void {
    if (data) {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } else {
      localStorage.removeItem(this.storageKey)
    }
  }
}

export const useAuthStore = defineStore('auth', () => {
  // Internal state using the pre-generated Directus types
  const directusUser = ref<Users | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Directus client setup
  // In development, use the proxy URL to avoid CORS issues
  const isDev = import.meta.env.DEV
  const directusServerUrl = import.meta.env.VITE_DIRECTUS_URL
  
  // Use the proxy URL in development to avoid CORS issues
  // Must include the full URL (including protocol) for the SDK
  const DIRECTUS_URL = isDev 
    ? window.location.origin + '/directus' 
    : directusServerUrl
  
  // Admin role ID from environment variable
  const ADMIN_ROLE_ID = import.meta.env.VITE_ADMIN_ROLE_ID
  
  // Create storage for persistent authentication
  const storage = new LocalStorage()

  // Create directus client with custom storage
  const directus = createDirectus(DIRECTUS_URL)
    .with(authentication('json', { storage }))
    .with(rest())

  // Computed user object that maps to our app's User interface
  const isAdmin = computed<boolean>(() => {
    if (!directusUser.value) return false
    
    // Check if user has admin role by comparing role ID with the admin role ID
    const isAdmin = typeof directusUser.value.role === 'object' 
      ? directusUser.value.role?.id === ADMIN_ROLE_ID
      : directusUser.value.role === ADMIN_ROLE_ID
    
    return isAdmin
  })

  /**
   * Initializes the authentication state from localStorage
   */
  async function initAuth(): Promise<void> {
    const authData = storage.get()
    
    if (authData?.access_token) {
      try {
        isLoading.value = true
        
        // Check if token is expired and needs refresh
        const now = Date.now()
        if (authData.expires_at && authData.expires_at < now && authData.refresh_token) {
          // Token is expired, try to refresh it
          try {
            await directus.refresh()
            isAuthenticated.value = true
            await fetchCurrentUser()
          } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr)
            // Clear invalid tokens
            storage.set(null)
            isAuthenticated.value = false
            directusUser.value = null
          }
        } else {
          // Token is still valid, just fetch the user
          isAuthenticated.value = true
          await fetchCurrentUser()
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        storage.set(null)
        isAuthenticated.value = false
        directusUser.value = null
      } finally {
        isLoading.value = false
      }
    }
  }

  /**
   * Fetches the current user's information
   */
  async function fetchCurrentUser(): Promise<void> {
    try {
      // Get current user from Directus using the readMe helper
      const currentUser = await directus.request(readMe({
        fields: ['role']
      })) as Partial<Users>
      
      if (currentUser) {
        directusUser.value = currentUser
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      directusUser.value = null
      // If we can't fetch the user, authentication is likely invalid
      isAuthenticated.value = false
      storage.set(null)
    }
  }

  /**
   * Handles user login
   */
  async function login(username: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    
    try {
      // Authenticate user
      await directus.login(username, password)
      
      // Set authentication status and fetch user data
      isAuthenticated.value = true
      await fetchCurrentUser()
      
      return true
    } catch (err) {
      error.value = 'Invalid username or password'
      console.error('Login error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logs the user out
   */
  async function logout(): Promise<void> {
    try {
      await directus.logout()
      
      // Reset state
      directusUser.value = null
      isAuthenticated.value = false
      // Clear storage
      storage.set(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  /**
   * Gets the Directus client instance
   */
  function getClient() {
    return directus
  }

  return {
    isAdmin,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getClient,
    initAuth
  }
}) 