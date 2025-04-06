<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div v-if="error" class="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 class="text-xl font-semibold text-gray-900">Da ist etwas schief gelaufen</h2>
        <p class="text-gray-600">Wir leiten dich weiter zur Login-Seite</p>

        <div class="py-4">
          <Progress :model-value="progressValue" class="w-full" />
        </div>
      </div>
      <div v-else>
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <h2 class="mt-6 text-center text-xl font-medium text-gray-900">
          Wir melden dich an...
        </h2>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CryptoJS from 'crypto-js'
import { Progress } from '@/components/ui/progress'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const error = ref<string | null>(null)
const progressValue = ref(0)
const redirectTime = 4000 // 4 seconds

// Secret key for decryption - in a real app, this should be stored securely
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_SECRET || 'default-secret-key'

onMounted(async () => {
  // Check if already authenticated
  if (authStore.isAuthenticated) {
    router.push('/')
    return
  }

  // Get the encrypted code from the URL
  const encryptedCode = route.query.code as string

  if (!encryptedCode) {
    error.value = 'Kein Login-Code vorhanden'
    startRedirectTimer()
    return
  }

  try {
    // Decrypt the code to get username and password
    const decrypted = CryptoJS.AES.decrypt(encryptedCode, SECRET_KEY).toString(CryptoJS.enc.Utf8)

    if (!decrypted) {
      error.value = 'Ungültiger Login-Code'
      startRedirectTimer()
      return
    }

    // Parse the decrypted data
    const credentials = JSON.parse(decrypted)

    if (!credentials.username || !credentials.password) {
      error.value = 'Ungültige Anmeldedaten'
      startRedirectTimer()
      return
    }

    // Attempt to login
    const success = await authStore.login(credentials.username, credentials.password)

    if (success) {
      // Redirect to home page on successful login
      router.push('/')
    } else {
      error.value = authStore.error || 'Anmeldung fehlgeschlagen'
      startRedirectTimer()
    }
  } catch (err) {
    console.error('Auto-login error:', err)
    error.value = 'Login-Code konnte nicht verarbeitet werden'
    startRedirectTimer()
  }
})

// Start a timer to redirect to login page
function startRedirectTimer() {
  const startTime = Date.now()
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime
    progressValue.value = Math.min((elapsed / redirectTime) * 100, 100)

    if (elapsed >= redirectTime) {
      clearInterval(interval)
      authStore.clearError() // Clear error message before redirecting
      router.push('/login')
    }
  }, 50)
}

</script>
