<template>
  <div class="w-full">
    <h2 class="text-xl font-semibold mb-4">Suche nach ähnlichen Objekten</h2>

    <!-- Search input -->
    <div class="mb-2">
      <input v-model="searchQuery" type="text" placeholder="Nach ähnlichen Objekten suchen..."
        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        @input="debouncedSearch" />
    </div>

    <div class="text-sm text-muted-foreground mb-4">
      <p>
        Wir bitten dich nach deinem Vorschlag im Objektkatalog zu suchen um doppelte Objekte zu vermeiden.
      </p>
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
    <div v-if="!isLoading && objects.length === 0" class="py-4 text-gray-500 flex flex-col items-center">
      <p>
        Deine Suche ergab keine Ergebnisse.
      </p>

      <div class="mt-4 flex flex-col items-center">
        <p class="mb-2">
          Möchtest du das Objekt anbieten?
        </p>
        <Button variant="outline" @click="openObjectSubmission">
          Zum Formular
        </Button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div v-for="object in objects" :key="object.id"
        class="border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        :class="{ 'ring-2 ring-primary': selectedObject?.id === object.id }" @click="selectObject(object)">
        <!-- Image -->
        <div class="aspect-square bg-gray-100 relative">
          <img v-if="object.abbildung" :src="getImageThumbnail(object.abbildung, 300, 300)" :alt="object.name || ''"
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

    <!-- Object detail dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ selectedObject?.name }}</DialogTitle>
          <DialogDescription v-if="selectedObject?.beschreibung">
            {{ selectedObject?.beschreibung }}
          </DialogDescription>
        </DialogHeader>

        <!-- Object image -->
        <div v-if="selectedObject" class="my-4">
          <div class="rounded-md overflow-hidden bg-gray-100">
            <img v-if="selectedObject.abbildung" :src="getImageThumbnail(selectedObject.abbildung, -1, -1)"
              :alt="selectedObject.name || ''" class="w-full object-contain max-h-[500px]" />
            <div v-else class="w-full h-64 flex items-center justify-center text-gray-400">
              Kein Bild
            </div>
          </div>
        </div>

        <!-- Additional details could be added here -->

        <DialogFooter>
          <Button variant="outline" @click="closeDialog">
            <X class="mr-2 h-4 w-4" />
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/auth'

import { Button } from '@/components/ui/button'
import { getImageThumbnailUrl } from '@/components/admin/FileHelpers'

import { useObjects } from '@/composables/useObjects'

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
const selectedObject = ref<any>(null)
const isDialogOpen = ref(false)
const router = useRouter()

// Select an object to show in the dialog
const selectObject = (object: any) => {
  selectedObject.value = object
  isDialogOpen.value = true
}

// Close the dialog
const closeDialog = () => {
  isDialogOpen.value = false
  // Optional: clear selection when dialog is closed
  // selectedObject.value = null
}

// Helper for image thumbnails
const getImageThumbnail = (fileData: any, width: number = 300, height: number = 300) => {
  if (!fileData) return ''
  const directusUrl = authStore.getClient().url.toString()
  return getImageThumbnailUrl(fileData, directusUrl, token.value, width, height)
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

// Define limited fields for this component
const limitedFields = [
  'id',
  'name',
  'beschreibung',
  'abbildung.*'
]

// Change page
const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return

  fetchObjects({
    page,
    query: searchQuery.value,
    fields: limitedFields
  })
}

const openObjectSubmission = () => {
  router.push('/')
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