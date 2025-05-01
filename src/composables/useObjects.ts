import { ref, computed } from 'vue'
import { readItems, aggregate, updateItem, readField, deleteItem, deleteFiles } from '@directus/sdk'
import type { ItemsObjekt } from '@/client/types.gen'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/components/ui/toast/use-toast'

export function useObjects() {
  const { toast } = useToast()

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

    // Create filter with "icontains" for each term as an OR condition (case insensitive)
    const nameFilters = terms.map((term) => ({
      name: { _icontains: term }
    }))

    const descriptionFilters = terms.map((term) => ({
      beschreibung: { _icontains: term }
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
      'kategorie',
      'status',
      'beschreibung',
      'anmerkungEinreicher',
      'anmerkung',
      'bewertung',
      'aktuellerStandort',
      'weitereAbbildungen.id',
      'weitereAbbildungen.directus_files_id',
      'weitereAbbildungen.directus_files_id.*'
    ],
    sortBy = ['name'],
    append = false
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

      // If append is true and we're not on the first page, add to existing objects
      // Otherwise, replace the objects array
      if (append && page > 1) {
        // Create a Set of existing IDs to avoid duplicates
        const existingIds = new Set(objects.value.map((obj) => obj.id))

        // Filter out any duplicates from the new response
        const newObjects = (response as ItemsObjekt[]).filter((obj) => !existingIds.has(obj.id))

        // Append new objects to the existing array
        objects.value = [...objects.value, ...newObjects]
      } else {
        // Replace the objects array (original behavior)
        objects.value = response as ItemsObjekt[]
      }

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
  const updateObjectField = async (objectId: string | number, field: string, value: any) => {
    if (!objectId) {
      error.value = 'Keine Objekt-ID angegeben'
      return false
    }

    try {
      // Create update payload
      const updatePayload: Record<string, any> = {}
      updatePayload[field] = value

      // Update in Directus
      await directus.request(updateItem('objekt', objectId, updatePayload))

      // Update local state
      const objectIdNum = typeof objectId === 'string' ? parseInt(objectId, 10) : objectId
      const index = objects.value.findIndex((item) => item.id === objectIdNum)
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

  // Delete an object
  const deleteObject = async (objectId: string | number) => {
    if (!objectId) {
      error.value = 'Keine Objekt-ID angegeben'
      toast({
        title: 'Fehler',
        description: 'Keine Objekt-ID angegeben',
        variant: 'warning'
      })
      return false
    }

    try {
      // First, fetch the object to get file IDs
      const objectToDelete = objects.value.find((item) => item.id === objectId)
      if (!objectToDelete) {
        error.value = 'Objekt konnte nicht gefunden werden'
        return false
      }

      // Get file IDs to delete
      const fileIds: string[] = []

      // Add main image if exists
      if (objectToDelete?.abbildung) {
        const mainFileId =
          typeof objectToDelete.abbildung === 'string'
            ? objectToDelete.abbildung
            : objectToDelete.abbildung.id

        if (mainFileId) fileIds.push(mainFileId)
      }

      // Add additional images if they exist
      if (objectToDelete?.weitereAbbildungen && objectToDelete.weitereAbbildungen.length > 0) {
        objectToDelete.weitereAbbildungen.forEach((item) => {
          if (typeof item === 'object' && item.directus_files_id) {
            const fileId =
              typeof item.directus_files_id === 'string'
                ? item.directus_files_id
                : item.directus_files_id.id

            if (fileId) fileIds.push(fileId)
          }
        })
      }

      // First delete associated files (if any)
      if (fileIds.length > 0) {
        try {
          await directus.request(deleteFiles(fileIds))
        } catch (fileErr) {
          console.error('Error deleting files:', fileErr)
          error.value = 'Fehler beim Löschen der zugehörigen Dateien'
          toast({
            title: 'Fehler',
            description: 'Fehler beim Löschen der zugehörigen Dateien',
            variant: 'destructive'
          })
          return false
        }
      }

      // Only proceed to delete the object if file deletion was successful
      await directus.request(deleteItem('objekt', objectId))

      // Remove from local state
      objects.value = objects.value.filter((item) => item.id !== objectId)

      return true
    } catch (err) {
      console.error('Error deleting object:', err)
      error.value = 'Fehler beim Löschen des Objekts'
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen des Objekts',
        variant: 'destructive'
      })
      return false
    }
  }

  // Get field options from Directus
  const getFieldOptions = async (fieldName: string) => {
    try {
      const fieldResponse = await directus.request(readField('objekt', fieldName))

      if (fieldResponse.meta?.options?.choices) {
        return {
          options: fieldResponse.meta.options.choices,
          error: null
        }
      }

      return {
        options: [],
        error: null
      }
    } catch (error) {
      console.error(`Error fetching ${fieldName} options:`, error)
      toast({
        title: 'Fehler',
        description: `Fehler beim Laden der ${fieldName}-Optionen.`,
        variant: 'destructive'
      })
      return {
        options: [],
        error: `Fehler beim Laden der ${fieldName}-Optionen.`,
        variant: 'destructive'
      }
    }
  }

  // Helper function to build a lookup dictionary for hierarchical fields
  const buildCategoryLookup = (options: any[]) => {
    const lookup: Record<string, string> = {}

    function processOption(option: any) {
      lookup[option.value] = option.text
      if (option.children && option.children.length > 0) {
        option.children.forEach(processOption)
      }
    }

    options.forEach(processOption)
    return lookup
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
    updateObjectField,
    getFieldOptions,
    buildCategoryLookup,
    deleteObject
  }
}
