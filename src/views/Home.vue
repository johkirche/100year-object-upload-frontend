<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Home Page</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">Logged in as: {{ authStore.user?.username }}</span>
        <Button variant="outline" size="sm" @click="handleLogout">Logout</Button>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <p class="mb-4">Welcome to the application!</p>
      
      <div v-if="authStore.user?.isAdmin" class="mb-4">
        <Button @click="goToAdmin">Go to Admin Dashboard</Button>
      </div>
      
      <div class="mt-6">
        <Button variant="outline" @click="goToAbout">About Page</Button>
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

const goToAdmin = () => {
  router.push('/admin')
}

const goToAbout = () => {
  router.push('/about')
}
</script>

<style scoped>
.home {
  padding: 2rem;
  text-align: center;
}
</style> 