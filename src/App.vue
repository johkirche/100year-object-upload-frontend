<script setup lang="ts">
  import { ref } from 'vue'
  import { useAuthStore } from './stores/auth'
  import Toaster from '@/components/ui/toast/Toaster.vue'
  import AdminMenu from '@/components/AdminMenu.vue'
  import { Button } from '@/components/ui/button'
  import { LogOut } from 'lucide-vue-next'
  import { useMediaQuery } from '@vueuse/core'
  import LogoutDialog from '@/components/LogoutDialog.vue'

  // Initialize the auth store
  const authStore = useAuthStore()

  // Check if device is mobile
  const isMobile = useMediaQuery('(max-width: 958px)')

  // Logout dialog state
  const showLogoutDialog = ref(false)

  // Handle logout button click
  const handleLogoutClick = () => {
    showLogoutDialog.value = true
  }

  // Handle actual logout after confirmation
  const handleLogout = async () => {
    await authStore.logout()
    window.location.href = '/login'
  }
</script>

<template>
  <Toaster />
  <div class="app-container flex flex-col">
    <!-- Mobile-only header with auth controls -->
    <template v-if="authStore.isAuthenticated">
      <header v-if="isMobile" class="app-header">
        <div class="container flex justify-between items-center py-2 px-4">
          <div class="flex items-center gap-3">
            <img
              src="@/assets/imgs/2025-05-29_logo_100Jahre_kompakt.svg"
              alt="Logo"
              class="h-8 w-16 rounded-md"
            />
            <h1 class="text-xl font-bold">Objektportal</h1>
          </div>

          <!-- Auth controls -->
          <div v-if="authStore.isAuthenticated" class="flex gap-2">
            <AdminMenu v-if="authStore.isAdmin" />
            <Button
              v-if="!authStore.isAdmin"
              variant="outline"
              size="sm"
              @click="handleLogoutClick"
              class="flex items-center gap-2"
            >
              <LogOut class="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <!-- Desktop auth controls (absolute positioning) -->
      <div v-else class="auth-controls">
        <div class="flex gap-2">
          <AdminMenu v-if="authStore.isAdmin" />
          <Button
            v-if="!authStore.isAdmin"
            variant="outline"
            size="sm"
            @click="handleLogoutClick"
            class="flex items-center gap-2 bg-gray-100 rounded-full"
          >
            <LogOut class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </template>

    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>
  </div>

  <!-- Logout confirmation dialog -->
  <LogoutDialog v-model:open="showLogoutDialog" @confirm="handleLogout" />
</template>

<style scoped>
  .app-container {
    height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: white;
    border-bottom: 1px solid #f1f1f1;
  }

  .auth-controls {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 50;
  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
