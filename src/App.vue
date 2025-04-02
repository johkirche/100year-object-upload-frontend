<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ShieldCheck, LogOut, FileText, UploadIcon } from 'lucide-vue-next'
import Toaster from '@/components/ui/toast/Toaster.vue'

// Initialize the auth store 
const authStore = useAuthStore()
const router = useRouter()

// No need to initialize auth here as it's now handled by the router
// This prevents the race condition where route guards run before auth is ready

// Handle logout
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Navigate to admin objects view
const viewObjects = () => {
  console.log("Navigating to admin page");
  console.log("isAdmin:", authStore.isAdmin);
  console.log("isAuthenticated:", authStore.isAuthenticated);
  router.push('/admin')
}
</script>

<template>
  <Toaster />
  <div class="app-container">
    <!-- Admin Icon for authenticated admins -->
    <div v-if="authStore.isAuthenticated && authStore.isAdmin" class="admin-icon">
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="ghost" size="icon" class="rounded-full">
            <ShieldCheck class="h-5 w-5 text-primary" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-56">
          <div class="grid gap-2">
            <h3 class="font-medium text-sm mb-2">Admin Menu</h3>
            <Button variant="ghost" class="flex w-full justify-start items-center gap-2" @click="router.push('/')">
              <UploadIcon class="h-4 w-4" />
              <span>Formular</span>
            </Button>
            <Button variant="ghost" class="flex w-full justify-start items-center gap-2" @click="viewObjects">
              <FileText class="h-4 w-4" />
              <span>View Objects</span>
            </Button>
            <Button variant="ghost" class="flex w-full justify-start items-center gap-2 text-red-500" @click="handleLogout">
              <LogOut class="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
}

.admin-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 50;
}
</style>
