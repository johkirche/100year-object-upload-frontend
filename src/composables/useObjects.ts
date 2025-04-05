import { ref, computed } from 'vue'
import { readItems, aggregate, updateItem } from '@directus/sdk'
import type { ItemsObjekt } from '@/client/types.gen'
import { useAuthStore } from '@/stores/auth'

export function useObjects() {
  const authStore = useAuthStore()
  const directus = authStore.getClient()
  
  // State
  const objects = ref<ItemsObjekt[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const totalItems = ref(0)
  const searchQuery = ref('')
  
  // Calculate total pages
  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))
  const pageSize = ref(10)
  const currentPage = ref(1)
  
  // Convert search query to filter for Directus
  const createSearchFilter = (query: string) => {
    if (!query.trim()) return {}
    
    // Split query by spaces to create OR conditions
    const terms = query.trim().split(/\s+/)
    
    if (terms.length === 0) return {}
    
    // Create filter with "contains" for each term as an OR condition
    const nameFilters = terms.map(term => ({
      name: { _contains: term }
    }))
    
    const descriptionFilters = terms.map(term => ({
      beschreibung: { _contains: term }
    }))
    
    // Combine name and description filters with OR
    return {
      _or: [...nameFilters, ...descriptionFilters]
    }
  }
  
  // Fetch objects from Directus
  const fetchObjects = async ({
    page = currentPage.value,
    itemsPerPage = pageSize.value,
    query = searchQuery.value,
    fields = [
      'id',
      'abbildung.*',
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
      'weitereAbbildungen.id',
      'weitereAbbildungen.directus_files_id',
      'weitereAbbildungen.directus_files_id.*'
    ],
    sortBy = ['name']
  } = {}) => {
    try {
      isLoading.value = true
      
      // Update the current search and page values
      searchQuery.value = query
      currentPage.value = page
      pageSize.value = itemsPerPage
      
      // Calculate offset for pagination
      const offset = (page - 1) * itemsPerPage
      
      // Build filter based on search query
      const filter = createSearchFilter(query)
      
      // Fetch objects and total count in parallel
      const [response, countResponse] = await Promise.all([
        directus.request(
          readItems('objekt', {
            fields,
            limit: itemsPerPage,
            offset,
            sort: sortBy,
            filter
          })
        ),
        directus.request(
          aggregate('objekt', {
            aggregate: { count: '*' },
            query: {
              filter: filter
            }
          })
        )
      ])
      
      objects.value = response as ItemsObjekt[]
      
      // Extract total count from response
      const meta = (countResponse as any[])[0] || {}
      totalItems.value = meta?.count || 0
      
      isLoading.value = false
      error.value = null
    } catch (err) {
      console.error('Error fetching objects:', err)
      error.value = 'Fehler beim Laden der Daten'
      isLoading.value = false
    }
  }
  
  // Update a specific field for an object
  const updateObjectField = async (
    objectId: string | number, 
    field: string, 
    value: any
  ) => {
    if (!objectId) {
      error.value = 'Keine Objekt-ID angegeben'
      return false
    }
    
    try {
      // Create update payload
      const updatePayload: Record<string, any> = {}
      updatePayload[field] = value
      
      // Update in Directus
      await directus.request(
        updateItem('objekt', objectId, updatePayload)
      )
      
      // Update local state
      const objectIdNum = typeof objectId === 'string' ? parseInt(objectId, 10) : objectId
      const index = objects.value.findIndex(item => item.id === objectIdNum)
      if (index !== -1) {
        // Create a new array to trigger reactivity
        const newData = [...objects.value]
        newData[index] = { ...newData[index], [field]: value }
        objects.value = newData
      }
      
      return true
    } catch (err) {
      console.error(`Error updating ${field}:`, err)
      error.value = `Fehler beim Speichern des Feldes ${field}`
      return false
    }
  }
  
  return {
    objects,
    isLoading,
    error,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    searchQuery,
    fetchObjects,
    updateObjectField
  }
} 