<template>
  <div class="w-full">
    <h2 class="text-xl font-semibold mb-4">Ähnliche Objekte</h2>

    <!-- Search input -->
    <div class="mb-4">
      <input v-model="searchQuery" type="text" placeholder="Nach ähnlichen Objekten suchen..."
        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        @input="debouncedSearch" />
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>

    <!-- Results -->
    <div v-if="!isLoading && objects.length === 0" class="text-center py-4 text-gray-500">
      Keine Objekte gefunden
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div v-for="object in objects" :key="object.id"
        class="border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <!-- Image -->
        <div class="aspect-square bg-gray-100 relative">
          <img v-if="object.abbildung" :src="getImageThumbnail(object.abbildung)" :alt="object.name || ''"
            class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            Kein Bild
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          <h3 class="font-medium text-lg truncate">{{ object.name }}</h3>
          <p v-if="object.beschreibung" class="text-sm text-gray-600 mt-1 line-clamp-2">
            {{ object.beschreibung }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6 space-x-2">
      <button :disabled="currentPage <= 1" class="px-3 py-1 border rounded disabled:opacity-50"
        @click="changePage(currentPage - 1)">
        Zurück
      </button>

      <span class="px-3 py-1">Seite {{ currentPage }} von {{ totalPages }}</span>

      <button :disabled="currentPage >= totalPages" class="px-3 py-1 border rounded disabled:opacity-50"
        @click="changePage(currentPage + 1)">
        Weiter
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useObjects } from '@/composables/useObjects'
import { useAuthStore } from '@/stores/auth'
import { getImageThumbnailUrl } from '@/components/admin/FileHelpers'

// Props
const props = defineProps({
  initialQuery: {
    type: String,
    default: ''
  }
})

// Use the composable for fetching objects
const {
  objects,
  isLoading,
  error,
  totalPages,
  currentPage,
  fetchObjects
} = useObjects()

// Internal state
const searchQuery = ref(props.initialQuery)
const searchTimeout = ref<number | null>(null)
const authStore = useAuthStore()
const token = ref('')

// Define limited fields for this component
const limitedFields = [
  'id',
  'name',
  'beschreibung',
  'abbildung.*'
]

// Helper for image thumbnails
const getImageThumbnail = (fileData: any) => {
  if (!fileData) return ''
  const directusUrl = authStore.getClient().url.toString()
  return getImageThumbnailUrl(fileData, directusUrl, token.value, 300, 300)
}

// Debounce search input
const debouncedSearch = () => {
  if (searchTimeout.value !== null) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = window.setTimeout(() => {
    search()
  }, 300) as unknown as number
}

// Search function
const search = () => {
  fetchObjects({
    page: 1,
    query: searchQuery.value,
    fields: limitedFields
  })
}

// Change page
const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return

  fetchObjects({
    page,
    query: searchQuery.value,
    fields: limitedFields
  })
}

// Lifecycle hooks
onMounted(async () => {
  if (authStore.isAuthenticated) {
    token.value = await authStore.getAuthToken()

    // Initial search if query is provided
    if (searchQuery.value) {
      search()
    } else {
      // Otherwise fetch first page
      fetchObjects({ fields: limitedFields })
    }
  }
})

onBeforeUnmount(() => {
  if (searchTimeout.value !== null) {
    clearTimeout(searchTimeout.value)
  }
})
</script>