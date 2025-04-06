<template>
  <div class="w-full relative">
    <h2 class="text-xl font-semibold mb-2">Suche nach ähnlichen Objekten</h2>

    <!-- Sticky search bar container -->
    <div class="sticky top-0 bg-background/95 backdrop-blur-sm z-20 py-2">
      <Input v-model="searchQuery" type="text" placeholder="Nach ähnlichen Objekten suchen..."
        @input="debouncedSearch" />
    </div>

    <!-- Rest of the content with proper spacing -->
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

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
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

    <!-- Infinite scroll trigger -->
    <div v-if="objects.length > 0 && canLoadMore" ref="loadMoreTrigger"
      class="h-10 flex items-center justify-center my-4">
      <div v-if="isLoading" class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <button v-else-if="currentPage < totalPages"
        class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90" @click="loadMore">
        Mehr laden
      </button>
      <div v-else class="text-sm text-muted-foreground">
        Alle Objekte geladen
      </div>
    </div>

    <!-- Pagination info -->
    <div v-if="objects.length > 0" class="text-center text-sm text-muted-foreground mt-2">
      <span>{{ objects.length }} von {{ totalItems }} Objekten angezeigt</span>
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
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getImageThumbnailUrl } from '@/components/admin/FileHelpers'

import { useObjects } from '@/composables/useObjects'

// Props
const props = defineProps({
  initialQuery: {
    type: String,
    default: ''
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
})

// Use the composable for fetching objects
const {
  objects,
  isLoading,
  error,
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  fetchObjects
} = useObjects()

// Set the page size from props
pageSize.value = props.itemsPerPage

// Internal state
const searchQuery = ref(props.initialQuery)
const searchTimeout = ref<number | null>(null)
const authStore = useAuthStore()
const token = ref('')
const selectedObject = ref<any>(null)
const isDialogOpen = ref(false)
const router = useRouter()

// Infinite scroll
const loadMoreTrigger = ref<HTMLElement | null>(null)
const observer = ref<IntersectionObserver | null>(null)
const canLoadMore = ref(true)

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
const search = async () => {
  // Reset canLoadMore when starting a new search
  canLoadMore.value = true

  await fetchObjects({
    page: 1,
    query: searchQuery.value,
    fields: limitedFields,
    itemsPerPage: props.itemsPerPage
  })
}

// Define limited fields for this component
const limitedFields = [
  'id',
  'name',
  'beschreibung',
  'abbildung.*'
]


// Load more objects (for infinite scroll)
const loadMore = async () => {
  if (isLoading.value || !canLoadMore.value) return

  // If we're already at the last page, don't try to load more
  if (currentPage.value >= totalPages.value) {
    canLoadMore.value = false
    return
  }

  // Load the next page and append to existing objects
  await fetchObjects({
    page: currentPage.value + 1,
    query: searchQuery.value,
    fields: limitedFields,
    itemsPerPage: props.itemsPerPage,
    append: true
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
      await search()
    } else {
      // Otherwise fetch first page
      await fetchObjects({
        fields: limitedFields,
        itemsPerPage: props.itemsPerPage
      })
    }

    // Set up intersection observer for infinite scroll
    nextTick(async () => {
      console.log('Setting up intersection observer')
      console.log(loadMoreTrigger.value)
      if ('IntersectionObserver' in window && loadMoreTrigger.value) {
        observer.value = new IntersectionObserver(async (entries) => {
          const [entry] = entries
          if (entry && entry.isIntersecting && !isLoading.value) {
            await loadMore()
          }
        }, {
          rootMargin: '100px' // Load more when element is 100px from viewport
        })

        observer.value.observe(loadMoreTrigger.value)
      }
    })
  }
})

onBeforeUnmount(() => {
  // Clear search timeout
  if (searchTimeout.value !== null) {
    clearTimeout(searchTimeout.value)
  }

  // Disconnect intersection observer
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>
