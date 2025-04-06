<template>
  <div class="max-w-7xl mx-auto p-2 sm:p-4">
    <SimilarObjects :initial-query="''" :items-per-page="itemsPerPage" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import SimilarObjects from '@/components/SimilarObjects.vue'

const itemsPerPage = computed(() => {
  // depending on screen size, return 3, 6 or 9
  const width = window.innerWidth
  if (width < 768) return 6
  if (width < 1024) return 10
  return 20
})
</script>
