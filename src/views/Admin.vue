<template>
  <div class="max-w-7xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Objekte</h1>
    
    <!-- Error message -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <ObjectTable 
      v-else
      :table="table"
      :columns="columns"
      :getFileType="getFileType"
      :getFileName="getFileName"
      :getImageThumbnailUrl="getImageThumbnailWithToken"
      :openAssetUrl="openAssetUrl"
      @updateAnmerkung="updateAnmerkung"
      @updateBewertung="updateBewertung"
    >
      <template #expanded-row="{ row, updateAnmerkung, updateBewertung }">
        <ObjectDetails 
          :object="row.original" 
          @update-anmerkung="updateAnmerkung"
          @update-bewertung="updateBewertung"
          :getFileType="getFileType"
          :getFileName="getFileName"
          :getImageThumbnailUrl="getImageThumbnailWithToken"
          :openAssetUrl="openAssetUrl"
        />
      </template>
    </ObjectTable>
  </div>
</template>

<script setup lang="ts">
import type {
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { ref, onMounted, watch, computed } from 'vue'
import type { ItemsObjekt } from '@/client/types.gen'
import { useAuthStore } from '@/stores/auth'
import { readItems, updateItem, aggregate } from '@directus/sdk'
import { useToast } from '@/components/ui/toast/use-toast'
import ObjectTable from '@/components/admin/ObjectTable.vue'
import ObjectDetails from '@/components/admin/ObjectDetails.vue'
import { createColumns } from '@/components/admin/TableColumns'
import { getFileType, getFileName, getImageThumbnailUrl, getAssetUrl } from '@/components/admin/FileHelpers'

// Use the Directus client from the auth store
const authStore = useAuthStore()
const directus = authStore.getClient()
const { toast } = useToast()

const token = ref<string>('')

// Function to get thumbnail URL with token
const getImageThumbnailWithToken = (fileData: any, width = 150, height = 150) => {
  return getImageThumbnailUrl(fileData, directus.url.toString(), token.value, width, height)
}

// Function to get asset URL with token and open it
const openAssetUrl = (fileData: any, download = false) => {
  console.log(fileData);
  
  const url = getAssetUrl(fileData, directus.url.toString(), token.value, download)
  if (url) window.open(url, '_blank')
}

// Data state
const data = ref<ItemsObjekt[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const totalItems = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// Define sorting state upfront to avoid reference errors
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})

// Create the columns configuration
const columns = createColumns(getFileType, getFileName, getImageThumbnailWithToken)

// Fetch data from Directus API
const fetchData = async (page = currentPage.value, itemsPerPage = pageSize.value) => {
  try {
    isLoading.value = true
    
    // Calculate offset based on page number and page size
    const offset = (page - 1) * itemsPerPage
    
    // Use Directus pagination parameters with deep joins
    const [response, countResponse] = await Promise.all([
      directus.request(
        readItems('objekt', {
          fields: [
            'id',
            'abbildung.*', // Get all fields from the abbildung (main image)
            'name',
            'datierung',
            'art',
            'format',
            'einreicherName',
            'einreicherGemeinde',
            'kontaktRueckfrage',
            'status',
            'beschreibung',
            'anmerkung',
            'bewertung',
            'aktuellerStandort',
            // Deep join to get through the junction table to the actual files
            'weitereAbbildungen.id',
            'weitereAbbildungen.directus_files_id',
            // The actual file data through the M:N relationship
            'weitereAbbildungen.directus_files_id.*'
          ],
          limit: itemsPerPage,
          offset: offset,
          sort: sorting.value.length > 0 
            ? sorting.value.map(s => `${s.desc ? '-' : ''}${s.id}`) 
            : ['name']
        })
      ),
      // For the count, use a separate request that should be compatible with Directus v19.x
      directus.request(
          aggregate('objekt', {
              aggregate: { count: '*' },
          })
      )
    ])
    
    data.value = response as ItemsObjekt[]
    
    // Extract total count from meta if available
    // This depends on the exact structure returned by your Directus version    
    const meta = (countResponse as any[])[0] || {};
    totalItems.value = meta?.count || 0;    
    
    isLoading.value = false
  } catch (err) {
    console.error('Error fetching objects:', err)
    error.value = 'Fehler beim Laden der Daten'
    isLoading.value = false
  }
}

// Callback when pagination or sorting changes
const handleTableChange = () => {
  // Get current page from the table
  const newPage = table.getState().pagination.pageIndex + 1
  
  // Update current page and fetch data if changed
  if (newPage !== currentPage.value) {
    currentPage.value = newPage
    fetchData(newPage, pageSize.value)
  }
}

onMounted(async () => {
  // Initialize auth and fetch data
  if (authStore.isAuthenticated) {
    token.value = await authStore.getAuthToken()
    fetchData()
  } else {
    error.value = 'Bitte melden Sie sich an, um die Daten zu sehen'
  }
})

// Watch for sorting changes to refetch data
watch(sorting, () => {
  fetchData()
}, { deep: true })

const updateAnmerkung = async (objekt: ItemsObjekt, value: string) => {
  if (objekt.id) {
    try {
      // Update directly in Directus
      await directus.request(
        updateItem('objekt', objekt.id, {
          anmerkung: value
        })
      )
      
      // Update local state
      const index = data.value.findIndex(item => item.id === objekt.id)
      if (index !== -1) {
        // Create a new array to trigger reactivity
        const newData = [...data.value]
        newData[index] = { ...newData[index], anmerkung: value }
        data.value = newData
      }

      toast({
        title: 'Anmerkung gespeichert',
        description: `Anmerkung für ${objekt.name} gespeichert`,
      })
    } catch (err) {
      console.error('Error updating anmerkung:', err)
      error.value = 'Fehler beim Speichern der Anmerkung'
    }
  }
}

const updateBewertung = async (objekt: ItemsObjekt, value: number) => {
  if (objekt.id) {
    try {
      // Update directly in Directus
      await directus.request(
        updateItem('objekt', objekt.id, {
          bewertung: value
        })
      )
      
      // Update local state
      const index = data.value.findIndex(item => item.id === objekt.id)
      if (index !== -1) {
        // Create a new array to trigger reactivity
        const newData = [...data.value]
        newData[index] = { ...newData[index], bewertung: value }
        data.value = newData
      }

      toast({
        title: 'Bewertung gespeichert',
        description: `Objekt ${objekt.name} wurde mit der Bewertung ${value} gespeichert`,
      })
    } catch (err) {
      console.error('Error updating bewertung:', err)
      error.value = 'Fehler beim Speichern der Bewertung'
    }
  }
}

// Calculate total pages for pagination
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const table = useVueTable({
  get data() { return data.value },
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true, // Enable manual pagination
  get pageCount() { return totalPages.value },
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onPaginationChange: () => handleTableChange(),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get expanded() { return expanded.value },
    get pagination() { 
      return {
        pageIndex: currentPage.value - 1,
        pageSize: pageSize.value
      }
    },
  },
})
</script> 