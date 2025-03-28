<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Admin Dashboard</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Welcome, {{ authStore.user?.username }}</h2>
        <Button variant="outline" @click="handleLogout">Logout</Button>
      </div>
      
      <div class="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-6" role="alert">
        <p class="font-bold">Admin Access</p>
        <p>You are currently logged in with elevated permissions.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 class="text-lg font-medium mb-2">Admin Settings</h3>
          <p class="text-gray-600 mb-4">Configure system settings and user permissions.</p>
          <Button>Manage Settings</Button>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 class="text-lg font-medium mb-2">User Management</h3>
          <p class="text-gray-600 mb-4">Manage user accounts and access controls.</p>
          <Button>Manage Users</Button>
        </div>
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
</script> 