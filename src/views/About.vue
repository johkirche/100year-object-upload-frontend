<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">About Page</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">Logged in as: {{ authStore.user?.username }}</span>
        <Button variant="outline" size="sm" @click="handleLogout">Logout</Button>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <p class="mb-4">This is an example of a protected route in a Vue 3 project.</p>
      <p class="mb-6">The application uses .env variables for authentication with different user roles.</p>
      
      <div class="flex gap-4">
        <Button @click="goToHome">Back to Home</Button>
        
        <Button v-if="authStore.user?.isAdmin" variant="outline" @click="goToAdmin">
          Admin Dashboard
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const goToHome = () => {
  router.push('/')
}

const goToAdmin = () => {
  router.push('/admin')
}
</script>

<style scoped>
.about {
  padding: 2rem;
  text-align: center;
}
</style> 