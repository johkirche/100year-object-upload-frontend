<template>
  <div class="max-w-7xl mx-auto p-4">
    <Tabs default-value="table">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Objekte</h1>
        <div>
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="table">
              <div class="flex items-center gap-2"><Table class="w-4 h-4" /> Datentabelle</div>
            </TabsTrigger>
            <TabsTrigger value="similar">
              <div class="flex items-center gap-2">
                <LayoutGrid class="w-4 h-4" /> Kachelansicht
              </div>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="table">
        <!-- Error message -->
        <div
          v-if="error"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {{ error }}
        </div>

        <ObjectTable
          :table="table"
          :columns="columns"
          :get-file-type="getFileType"
          :get-file-name="getFileName"
          :get-image-thumbnail-url="getImageThumbnailWithToken"
          :open-asset-url="openAssetUrl"
          @update-anmerkung="updateAnmerkung"
          @update-bewertung="updateBewertung"
          @update-categories="updateCategories"
          @delete-object="deleteObject"
        >
          <template #search-bar>
            <!-- Search bar -->
            <div class="flex items-center w-full max-w-md gap-2">
              <Input
                v-model="searchQuery"
                type="text"
                placeholder="Suche nach Objekten..."
                class="flex-grow"
                @input="debouncedSearch"
              />
              <!-- Loading state -->
              <div v-if="isLoading" class="flex justify-center items-center">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            </div>
          </template>
          <template #expanded-row="{ row }">
            <ObjectDetails
              :object="row.original"
              :get-file-type="getFileType"
              :get-file-name="getFileName"
              :get-image-thumbnail-url="getImageThumbnailWithToken"
              :open-asset-url="openAssetUrl"
              @update-anmerkung="updateAnmerkung"
              @update-bewertung="updateBewertung"
              @update-categories="updateCategories"
              @delete-object="deleteObject"
            />
          </template>
        </ObjectTable>
      </TabsContent>
      <TabsContent value="similar">
        <SimilarObjects :initial-query="''" :items-per-page="itemsPerPage" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'

  import { Table, LayoutGrid } from 'lucide-vue-next'
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import type {
    ColumnFiltersState,
    ExpandedState,
    SortingState,
    VisibilityState
  } from '@tanstack/vue-table'
  import { valueUpdater } from '@/lib/utils'
  import {
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useVueTable
  } from '@tanstack/vue-table'
  import type { ItemsObjekt } from '@/client/types.gen'

  import { useToast } from '@/components/ui/toast/use-toast'
  import { useAuthStore } from '@/stores/auth'
  import { useObjects } from '@/composables/useObjects'

  import SimilarObjects from '@/components/SimilarObjects.vue'

  import { Input } from '@/components/ui/input'

  import {
    getFileType,
    getFileName,
    getImageThumbnailUrl,
    getAssetUrl
  } from '@/components/admin/FileHelpers'
  import { createColumns } from '@/components/admin/TableColumns'
  import ObjectTable from '@/components/admin/ObjectTable.vue'
  import ObjectDetails from '@/components/admin/ObjectDetails.vue'

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
    const url = getAssetUrl(fileData, directus.url.toString(), token.value, download)
    if (url) window.open(url, '_blank')
  }

  // Use the objects composable
  const {
    objects: data,
    isLoading,
    error,
    totalPages,
    currentPage,
    pageSize,
    fetchObjects,
    updateObjectField,
    deleteObject: deleteObjectFromDb
  } = useObjects()

  // Search state
  const searchQuery = ref('')
  const searchTimeout = ref<number | null>(null)

  // Define sorting state upfront to avoid reference errors
  const sorting = ref<SortingState>([])
  const columnFilters = ref<ColumnFiltersState>([])
  const columnVisibility = ref<VisibilityState>({})
  const rowSelection = ref({})
  const expanded = ref<ExpandedState>({})

  // Create the columns configuration
  const columns = createColumns(getFileType, getFileName, getImageThumbnailWithToken)

  // Debounce search to prevent too many API calls
  const debouncedSearch = () => {
    if (searchTimeout.value !== null) {
      clearTimeout(searchTimeout.value)
    }

    searchTimeout.value = window.setTimeout(() => {
      handleSearch()
    }, 300) as unknown as number
  }

  // Clean up timeout on component unmount
  onBeforeUnmount(() => {
    if (searchTimeout.value !== null) {
      clearTimeout(searchTimeout.value)
    }
  })

  // Search handler
  const handleSearch = () => {
    // Reset to first page when searching
    fetchObjects({
      page: 1,
      query: searchQuery.value,
      sortBy:
        sorting.value.length > 0
          ? sorting.value.map((s) => `${s.desc ? '-' : ''}${s.id}`)
          : ['name']
    })
  }

  // Callback when pagination or sorting changes
  const handleTableChange = (updatedState: any) => {
    if (updatedState && updatedState.pageIndex !== undefined) {
      // Get the updated page index directly from the updated state
      const newPage = updatedState.pageIndex + 1

      // Always update current page and fetch data when pagination changes
      fetchObjects({
        page: newPage,
        query: searchQuery.value,
        sortBy:
          sorting.value.length > 0
            ? sorting.value.map((s) => `${s.desc ? '-' : ''}${s.id}`)
            : ['name']
      })
    }
  }

  onMounted(async () => {
    // Initialize auth and fetch data
    if (authStore.isAuthenticated) {
      token.value = await authStore.getAuthToken()
      fetchObjects()
    } else {
      error.value = 'Bitte melden Sie sich an, um die Daten zu sehen'
    }
  })

  // Watch for sorting changes to refetch data
  watch(
    sorting,
    () => {
      fetchObjects({
        query: searchQuery.value,
        sortBy:
          sorting.value.length > 0
            ? sorting.value.map((s) => `${s.desc ? '-' : ''}${s.id}`)
            : ['name']
      })
    },
    { deep: true }
  )

  const updateAnmerkung = async (objekt: ItemsObjekt, value: string) => {
    if (objekt.id) {
      const success = await updateObjectField(objekt.id, 'anmerkung', value)

      if (success) {
        toast({
          title: 'Anmerkung gespeichert',
          description: `Anmerkung für ${objekt.name} gespeichert`
        })
      }
    }
  }

  const updateBewertung = async (objekt: ItemsObjekt, value: number, label: string) => {
    if (objekt.id) {
      const success = await updateObjectField(objekt.id, 'bewertung', value)

      if (success) {
        toast({
          title: 'Bewertung gespeichert',
          description: `Objekt ${objekt.name} wurde mit der Bewertung ${label} gespeichert`,
          variant: 'success'
        })
      }
    }
  }

  const updateCategories = async (objekt: ItemsObjekt, categories: string[]) => {
    if (objekt.id) {
      const success = await updateObjectField(objekt.id, 'kategorie', categories)

      if (success) {
        toast({
          title: 'Kategorien gespeichert',
          description: `Kategorien für ${objekt.name} wurden aktualisiert`,
          variant: 'success'
        })
      }
    }
  }

  const deleteObject = async (objekt: ItemsObjekt) => {
    if (objekt.id) {
      const success = await deleteObjectFromDb(objekt.id)

      if (success) {
        toast({
          title: 'Objekt gelöscht',
          description: `Objekt ${objekt.name} wurde erfolgreich gelöscht`,
          variant: 'success'
        })

        // Refresh the object list after deletion
        fetchObjects({
          page: currentPage.value,
          query: searchQuery.value,
          sortBy:
            sorting.value.length > 0
              ? sorting.value.map((s) => `${s.desc ? '-' : ''}${s.id}`)
              : ['name']
        })
      }
    }
  }

  const table = useVueTable({
    get data() {
      return data.value
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Enable manual pagination
    get pageCount() {
      return totalPages.value
    },
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
    onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
    onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
    onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
    onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
    onPaginationChange: (updater) => {
      // Get the updated state directly from the updater function
      const newState =
        typeof updater === 'function'
          ? updater({ pageIndex: currentPage.value - 1, pageSize: pageSize.value })
          : updater

      // Call handleTableChange with the new state
      handleTableChange(newState)
    },
    state: {
      get sorting() {
        return sorting.value
      },
      get columnFilters() {
        return columnFilters.value
      },
      get columnVisibility() {
        return columnVisibility.value
      },
      get rowSelection() {
        return rowSelection.value
      },
      get expanded() {
        return expanded.value
      },
      get pagination() {
        return {
          pageIndex: currentPage.value - 1,
          pageSize: pageSize.value
        }
      }
    }
  })

  const itemsPerPage = computed(() => {
    // depending on screen size, return 3, 6 or 9
    const width = window.innerWidth
    if (width < 768) return 6
    if (width < 1024) return 10
    return 20
  })
</script>
