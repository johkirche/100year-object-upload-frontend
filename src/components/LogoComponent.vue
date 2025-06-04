<template>
  <div class="fixed top-4 left-4 z-20">
    <img
      src="@/assets/imgs/2025-06-02_logo_100Jahre.svg"
      alt="100 Jahre Logo"
      class="w-48 h-48 logo-component"
    />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
  /* Hide the logo component on mobile */
  @media (max-width: 1268px) {
    .logo-component {
      display: none;
    }
  }
</style>
