<script setup lang="ts">
import { useAuthStore } from './stores/auth'

// Initialize the auth store 
const authStore = useAuthStore()
</script>

<template>
  <div class="app-container">
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}
</style>
